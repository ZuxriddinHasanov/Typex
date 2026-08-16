import { Router, Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { rateLimit } from "express-rate-limit";
import * as UserDAL from "../../dal/user";
import { TypeUZResponse } from "../../utils/typeuz-response";
import { signToken, verifyToken } from "../../utils/jwt";
import Logger from "../../utils/logger";
import * as db from "../../init/db";
import { collection } from "../../init/db";
import { isDevEnvironment } from "../../utils/misc";
import { devGet, devSet } from "../../utils/dev-store";
import {
  GenderSchema,
  NewPasswordSchema,
  UserEmailSchema,
  UserNameSchema,
} from "@typeuz/schemas/users";
import { z } from "zod";
import { verify as verifyCaptcha } from "../../utils/captcha";
import TypeUZError from "../../utils/error";
import * as BlocklistDAL from "../../dal/blocklist";
import {
  getPasswordDocument,
  savePasswordDocument,
} from "../../utils/custom-auth-store";

const LOGIN_LOG_KEY = "login_log";
function recordLogin(uid: string): void {
  const log = isDevEnvironment()
    ? (devGet<Array<{ uid: string; timestamp: number }>>(LOGIN_LOG_KEY) ?? [])
    : [];
  log.push({ uid, timestamp: Date.now() });
  if (log.length > 50000) log.splice(0, log.length - 50000);
  if (isDevEnvironment()) devSet(LOGIN_LOG_KEY, log);
}

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevEnvironment() ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const RegistrationSchema = z.object({
  email: UserEmailSchema,
  password: NewPasswordSchema,
  name: UserNameSchema,
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  captcha: z.string().optional(),
  gender: GenderSchema.optional(),
  age: z.number().int().min(10).max(120).optional(),
  avatar: z.string().max(2048).optional(),
});

type UserMeta = {
  uid: string;
  email: string;
  name: string;
};

async function findUserByEmail(email: string): Promise<UserMeta | null> {
  const user = await UserDAL.findByEmail(email);
  if (!user) return null;
  return { uid: user.uid, email: user.email, name: user.name };
}

async function findUserByName(name: string): Promise<UserMeta | null> {
  const user = await UserDAL.findByName(name);
  if (!user) return null;
  return { uid: user.uid, email: user.email, name: user.name };
}

async function saveUserMeta(_meta: UserMeta): Promise<void> {
  // Now handled by UserDAL.addUser directly in PostgreSQL
}

async function signUserToken(user: UserMeta): Promise<string> {
  const tokenVersion = (await UserDAL.getTokenVersion(user.uid)) ?? 0;
  return signToken({
    uid: user.uid,
    email: user.email,
    tokenVersion,
  });
}

router.post(
  "/email/register",
  authLimiter,
  async (req: Request, res: Response) => {
    try {
      const parsed = RegistrationSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(422)
          .json(
            new TypeUZResponse(
              "Ro'yxatdan o'tish ma'lumotlari noto'g'ri",
              null,
            ),
          );
        return;
      }
      const {
        email,
        password,
        name,
        firstName,
        lastName,
        captcha,
        gender,
        age,
        avatar,
      } = parsed.data;
      const normalizedEmail = email.trim().toLowerCase();

      if (!(await verifyCaptcha(captcha))) {
        res.status(422).json(new TypeUZResponse("Captcha tasdiqlanmadi", null));
        return;
      }

      const existing = await findUserByEmail(normalizedEmail);
      if (existing !== null) {
        res
          .status(409)
          .json(
            new TypeUZResponse("Bu email allaqachon ro'yxatdan o'tgan", null),
          );
        return;
      }
      if (await findUserByName(name)) {
        res.status(409).json(new TypeUZResponse("Bu username band", null));
        return;
      }
      if (await BlocklistDAL.contains({ name, email: normalizedEmail })) {
        res
          .status(409)
          .json(
            new TypeUZResponse(
              "Bu profil bilan ro'yxatdan o'tib bo'lmaydi",
              null,
            ),
          );
        return;
      }

      const uid = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(password, 10);

      await UserDAL.addUser(
        name,
        normalizedEmail,
        uid,
        gender,
        age,
        avatar,
        firstName,
        lastName,
      );
      await saveUserMeta({ uid, email: normalizedEmail, name });
      try {
        await savePasswordDocument({
          uid,
          passwordHash: hashedPassword,
          createdAt: Date.now(),
        });
      } catch (error) {
        await UserDAL.deleteUser(uid).catch(() => undefined);
        throw error;
      }

      const token = signToken({ uid, email: normalizedEmail, tokenVersion: 0 });

      res.status(201).json(
        new TypeUZResponse("Ro'yxatdan o'tish muvaffaqiyatli", {
          uid,
          email: normalizedEmail,
          name,
          token,
        }),
      );
    } catch (e) {
      Logger.error(`Register error: ${(e as Error).message}`);
      if (e instanceof TypeUZError) {
        res.status(e.status).json(new TypeUZResponse(e.message, null));
        return;
      }
      if ((e as { code?: string }).code === "23505") {
        res
          .status(409)
          .json(new TypeUZResponse("Email yoki username band", null));
        return;
      }
      res
        .status(500)
        .json(new TypeUZResponse("Ro'yxatdan o'tishda xatolik", null));
    }
  },
);

router.post(
  "/email/login",
  authLimiter,
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (
        email === undefined ||
        email === "" ||
        password === undefined ||
        password === ""
      ) {
        res
          .status(400)
          .json(
            new TypeUZResponse("Email yoki username va parol majburiy", null),
          );
        return;
      }

      const login = email.trim().toLowerCase();
      const isEmail = login.includes("@");
      const user = isEmail
        ? await findUserByEmail(login)
        : await findUserByName(login);
      if (user === null) {
        res
          .status(401)
          .json(
            new TypeUZResponse("Email/username yoki parol noto'g'ri", null),
          );
        return;
      }

      const pwDoc = await getPasswordDocument(user.uid);
      if (pwDoc === null) {
        res
          .status(401)
          .json(
            new TypeUZResponse("Email/username yoki parol noto'g'ri", null),
          );
        return;
      }

      const match = await bcrypt.compare(password, pwDoc.passwordHash);
      if (!match) {
        res
          .status(401)
          .json(
            new TypeUZResponse("Email/username yoki parol noto'g'ri", null),
          );
        return;
      }

      await UserDAL.updateLastLoginAt(user.uid).catch(() => {
        // Silently ignore
      });

      const token = await signUserToken(user);
      recordLogin(user.uid);

      res.status(200).json(
        new TypeUZResponse("Kirish muvaffaqiyatli", {
          uid: user.uid,
          email: user.email,
          name: user.name,
          token,
        }),
      );
    } catch (e) {
      Logger.error(`Login error: ${(e as Error).message}`);
      res.status(500).json(new TypeUZResponse("Kirishda xatolik", null));
    }
  },
);

router.post(
  "/email/reauthenticate",
  authLimiter,
  async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const password = (req.body as { password?: unknown }).password;
      if (
        authHeader === undefined ||
        !authHeader.startsWith("Bearer ") ||
        typeof password !== "string" ||
        password === ""
      ) {
        res
          .status(401)
          .json(new TypeUZResponse("Qayta kirish talab qilinadi", null));
        return;
      }

      const decoded = verifyToken(authHeader.slice(7));
      if (decoded.admin === true) {
        res
          .status(403)
          .json(new TypeUZResponse("Noto'g'ri akkaunt turi", null));
        return;
      }
      const passwordDocument = await getPasswordDocument(decoded.uid);
      if (
        passwordDocument === null ||
        !(await bcrypt.compare(password, passwordDocument.passwordHash))
      ) {
        res.status(401).json(new TypeUZResponse("Parol noto'g'ri", null));
        return;
      }

      const user = await findUserByEmail(decoded.email);
      if (user === null || user.uid !== decoded.uid) {
        res
          .status(401)
          .json(new TypeUZResponse("Foydalanuvchi topilmadi", null));
        return;
      }
      const token = await signUserToken(user);
      res.status(200).json(
        new TypeUZResponse("Qayta kirish muvaffaqiyatli", {
          token,
          uid: decoded.uid,
          email: user.email,
          name: user.name,
        }),
      );
    } catch {
      res.status(401).json(new TypeUZResponse("Yaroqsiz token", null));
    }
  },
);

export async function verifyGoogleToken(
  token: string,
): Promise<{ email: string; name: string } | null> {
  try {
    let resp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`,
    );
    let payload: Record<string, unknown> = {};

    if (resp.ok) {
      payload = (await resp.json()) as Record<string, unknown>;
    } else {
      resp = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`,
      );
      if (!resp.ok) return null;
      payload = (await resp.json()) as Record<string, unknown>;
    }

    const email = payload["email"] as string | undefined;
    const name = payload["name"] as string | undefined;
    const emailVerified = (payload["email_verified"] ??
      payload["verified_email"]) as string | boolean | undefined;

    if (
      email === undefined ||
      email === "" ||
      String(emailVerified) !== "true"
    ) {
      return null;
    }

    return {
      email,
      name: name ?? email.split("@")[0] ?? "google_user",
    };
  } catch {
    return null;
  }
}

router.post("/google", authLimiter, async (req: Request, res: Response) => {
  try {
    const { idToken, email: devEmail, name: devName } = req.body as {
      idToken?: string;
      email?: string;
      name?: string;
    };

    if (idToken === undefined || idToken === "") {
      res
        .status(400)
        .json(new TypeUZResponse("Google ID token majburiy", null));
      return;
    }

    let googleInfo = await verifyGoogleToken(idToken);
    if (googleInfo === null && isDevEnvironment() && devEmail !== undefined && devEmail !== "") {
      googleInfo = {
        email: devEmail,
        name: devName ?? devEmail.split("@")[0] ?? "google_dev_user",
      };
    }
    if (
      googleInfo === null ||
      googleInfo.email === undefined ||
      googleInfo.email === ""
    ) {
      res
        .status(401)
        .json(new TypeUZResponse("Google token tasdiqlanmadi", null));
      return;
    }

    const { email, name } = googleInfo;

    let user = await findUserByEmail(email);

    if (user === null) {
      const uid = crypto.randomUUID();
      let username = name ?? email.split("@")[0] ?? `user_${uid.slice(0, 8)}`;
      username = username.replace(/[^a-zA-Z0-9_]/g, "");
      if (username.length < 2) username = `user_${uid.slice(0, 5)}`;

      let isUnique = false;
      let counter = 0;
      while (!isUnique) {
        const existing = await findUserByName(username);
        if (existing !== null) {
          counter++;
          username = `${username.replace(/[0-9]+$/, "")}${counter}`;
        } else {
          isUnique = true;
        }
      }

      await UserDAL.addUser(username, email, uid);
      await saveUserMeta({ uid, email, name: username });
      user = await findUserByEmail(email);
    }

    if (user === null) {
      res
        .status(500)
        .json(new TypeUZResponse("Foydalanuvchi yaratishda xatolik", null));
      return;
    }

    const token = await signUserToken(user);

    await UserDAL.updateLastLoginAt(user.uid).catch(() => {
      // Silently ignore
    });

    recordLogin(user.uid);
    res.status(200).json(
      new TypeUZResponse("Google orqali kirish muvaffaqiyatli", {
        uid: user.uid,
        email: user.email,
        name: user.name,
        token,
      }),
    );
  } catch (e) {
    Logger.error(`Google auth error: ${(e as Error).message}`);
    res
      .status(500)
      .json(new TypeUZResponse("Google orqali kirishda xatolik", null));
  }
});

router.post("/github", authLimiter, async (req: Request, res: Response) => {
  try {
    const { code } = req.body as { code?: string };

    if (code === undefined || code === "") {
      res
        .status(400)
        .json(new TypeUZResponse("GitHub authorization code majburiy", null));
      return;
    }

    const GITHUB_CLIENT_ID = process.env["GITHUB_CLIENT_ID"];
    const GITHUB_CLIENT_SECRET = process.env["GITHUB_CLIENT_SECRET"];
    if (
      GITHUB_CLIENT_ID === undefined ||
      GITHUB_CLIENT_ID === "" ||
      GITHUB_CLIENT_SECRET === undefined ||
      GITHUB_CLIENT_SECRET === ""
    ) {
      res.status(503).json(new TypeUZResponse("GitHub auth sozlanmagan", null));
      return;
    }

    const tokenResp = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );

    const tokenData = (await tokenResp.json()) as {
      access_token?: string;
      error?: string;
    };

    if (
      !tokenResp.ok ||
      tokenData.access_token === undefined ||
      tokenData.access_token === ""
    ) {
      res
        .status(401)
        .json(new TypeUZResponse("GitHub token olishda xatolik", null));
      return;
    }

    const userResp = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const ghUser = (await userResp.json()) as {
      login?: string;
      email?: string;
      id?: number;
    };

    if (!userResp.ok || ghUser.id === undefined) {
      res
        .status(401)
        .json(new TypeUZResponse("GitHub profili tasdiqlanmadi", null));
      return;
    }
    const email =
      ghUser.email ?? `github-${ghUser.id}@users.noreply.github.com`;

    let user = await findUserByEmail(email);

    if (user === null) {
      const uid = crypto.randomUUID();
      let username = ghUser.login ?? `gh_${uid.slice(0, 8)}`;
      username = username.replace(/[^a-zA-Z0-9_]/g, "");
      if (username.length < 2) username = `gh_${uid.slice(0, 5)}`;

      let isUnique = false;
      let counter = 0;
      while (!isUnique) {
        const existing = await findUserByName(username);
        if (existing !== null) {
          counter++;
          username = `${username.replace(/[0-9]+$/, "")}${counter}`;
        } else {
          isUnique = true;
        }
      }

      await UserDAL.addUser(username, email, uid);
      await saveUserMeta({ uid, email, name: username });
      user = await findUserByEmail(email);
    }

    if (user === null) {
      res
        .status(500)
        .json(new TypeUZResponse("Foydalanuvchi yaratishda xatolik", null));
      return;
    }

    const token = await signUserToken(user);

    await UserDAL.updateLastLoginAt(user.uid).catch(() => {
      // Silently ignore
    });

    recordLogin(user.uid);
    res.status(200).json(
      new TypeUZResponse("GitHub orqali kirish muvaffaqiyatli", {
        uid: user.uid,
        email: user.email,
        name: user.name,
        token,
      }),
    );
  } catch (e) {
    Logger.error(`GitHub auth error: ${(e as Error).message}`);
    res
      .status(500)
      .json(new TypeUZResponse("GitHub orqali kirishda xatolik", null));
  }
});

router.get("/github/login", (_req: Request, res: Response) => {
  const clientId = process.env["GITHUB_CLIENT_ID"];
  const feUrl = (): string =>
    `${process.env["FRONTEND_URL"] ?? (isDevEnvironment() ? "http://localhost:3000" : "https://typeuz.uz")}/auth-callback.html`;

  if (clientId === undefined || clientId === "") {
    if (isDevEnvironment()) {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <title>Dev GitHub Login</title>
          <style>
            body { font-family: sans-serif; background: #18181b; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #27272a; padding: 24px; border-radius: 12px; max-width: 360px; width: 90%; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
            input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #3f3f46; background: #18181b; color: #fff; margin: 12px 0; box-sizing: border-box; }
            button { width: 100%; padding: 10px; background: #FF5A1F; border: none; border-radius: 8px; color: #fff; font-weight: bold; cursor: pointer; }
            .info { font-size: 12px; color: #a1a1aa; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h3>Dev GitHub Login</h3>
            <p style="font-size: 13px; color: #a1a1aa;">GITHUB_CLIENT_ID sozlanmaganligi sababli dev rejimida username bilan kirishingiz mumkin:</p>
            <input type="text" id="username" placeholder="GitHub username" value="github_user" />
            <button onclick="login()">GitHub sifatida kirish</button>
            <p class="info">Haqiqiy GitHub OAuth uchun .env faylida GITHUB_CLIENT_ID va GITHUB_CLIENT_SECRET sozlang.</p>
          </div>
          <script>
            async function login() {
              const username = document.getElementById('username').value.trim() || 'github_user';
              const devRes = await fetch('/dev/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
              });
              const devData = await devRes.json();
              if (devData && devData.data) {
                const tokenRes = await fetch('/auth/google', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idToken: 'dev_mock_token', email: devData.data.email, name: devData.data.name })
                });
                const tokenData = await tokenRes.json();
                const authData = (tokenData && tokenData.data) ? tokenData.data : devData.data;
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'typeuz_oauth',
                    success: true,
                    token: authData.token || 'dev_token_' + authData.uid,
                    uid: authData.uid,
                    email: authData.email,
                    name: authData.name
                  }, '*');
                  window.close();
                }
              } else {
                alert((devData && devData.message) || 'Xatolik yuz berdi');
              }
            }
          </script>
        </body>
        </html>
      `);
      return;
    }
    res.redirect(`${feUrl()}?auth_error=${encodeURIComponent("GitHub auth sozlanmagan")}`);
    return;
  }
  const state = crypto.randomBytes(32).toString("hex");
  res.cookie("typeuz_github_state", state, {
    httpOnly: true,
    secure: !isDevEnvironment(),
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/auth/github/callback",
  });
  const callbackUrl =
    process.env["GITHUB_REDIRECT_URI"] ??
    `${_req.protocol}://${_req.get("host") ?? _req.hostname}/auth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=user:email&state=${state}`;
  res.redirect(url);
});

router.get("/github/callback", async (req: Request, res: Response) => {
  const feUrl = (): string =>
    `${process.env["FRONTEND_URL"] ?? (isDevEnvironment() ? "http://localhost:3000" : "https://typeuz.uz")}/auth-callback.html`;

  try {
    const { code, state } = req.query as { code?: string; state?: string };
    const { error: errorParam } = req.query as { error?: string };

    if (errorParam !== undefined && errorParam !== "") {
      res.redirect(`${feUrl()}?auth_error=${errorParam}`);
      return;
    }

    if (code === undefined || code === "") {
      res.redirect(`${feUrl()}?auth_error=missing_code`);
      return;
    }

    const stateCookie = req.headers.cookie
      ?.split(";")
      .map((part) => part.trim().split("="))
      .find(([key]) => key === "typeuz_github_state")?.[1];
    res.clearCookie("typeuz_github_state", {
      httpOnly: true,
      secure: !isDevEnvironment(),
      sameSite: "lax",
      path: "/auth/github/callback",
    });
    if (
      state === undefined ||
      stateCookie === undefined ||
      state.length !== stateCookie.length ||
      !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(stateCookie))
    ) {
      res.redirect(`${feUrl()}?auth_error=invalid_state`);
      return;
    }

    const GITHUB_CLIENT_ID = process.env["GITHUB_CLIENT_ID"];
    const GITHUB_CLIENT_SECRET = process.env["GITHUB_CLIENT_SECRET"];
    if (
      GITHUB_CLIENT_ID === undefined ||
      GITHUB_CLIENT_ID === "" ||
      GITHUB_CLIENT_SECRET === undefined ||
      GITHUB_CLIENT_SECRET === ""
    ) {
      res.redirect(`${feUrl()}?auth_error=github_not_configured`);
      return;
    }

    const tokenResp = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );

    const tokenData = (await tokenResp.json()) as {
      access_token?: string;
      error?: string;
    };
    if (
      !tokenResp.ok ||
      tokenData.access_token === undefined ||
      tokenData.access_token === ""
    ) {
      res.redirect(`${feUrl()}?auth_error=token_exchange_failed`);
      return;
    }

    const userResp = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const ghUser = (await userResp.json()) as {
      login?: string;
      email?: string;
      id?: number;
    };
    if (!userResp.ok || ghUser.id === undefined) {
      res.redirect(`${feUrl()}?auth_error=invalid_github_profile`);
      return;
    }
    const email =
      ghUser.email ?? `github-${ghUser.id}@users.noreply.github.com`;

    let user = await findUserByEmail(email);
    if (user === null) {
      const uid = crypto.randomUUID();
      const username = ghUser.login ?? `gh_${uid.slice(0, 8)}`;
      await UserDAL.addUser(username, email, uid);
      await saveUserMeta({ uid, email, name: username });
      user = await findUserByEmail(email);
    }

    if (user === null) {
      res.redirect(`${feUrl()}?auth_error=user_creation_failed`);
      return;
    }

    const token = await signUserToken(user);
    res.redirect(
      `${feUrl()}?auth_token=${token}&auth_uid=${user.uid}&auth_email=${encodeURIComponent(user.email)}&auth_name=${encodeURIComponent(user.name)}`,
    );
  } catch (e) {
    Logger.error(`GitHub callback error: ${(e as Error).message}`);
    res.redirect(`${feUrl()}?auth_error=internal_error`);
  }
});

// --- Admin auth ---

const ADMIN_CRED_KEY = "admin_credentials";

type AdminCredDoc = {
  username: string;
  passwordHash: string;
  createdAt: number;
};

async function getAdminCredDoc(username: string): Promise<AdminCredDoc | null> {
  if (isDevEnvironment()) {
    const creds = devGet<Record<string, AdminCredDoc>>(ADMIN_CRED_KEY) ?? {};
    return creds[username.toLowerCase()] ?? null;
  }
  const doc = await (
    db.collection("admin-credentials") as unknown as {
      findOne: (
        filter: Record<string, unknown>,
      ) => Promise<AdminCredDoc | null>;
    }
  ).findOne({ username: username.toLowerCase() });
  return doc;
}

async function saveAdminCredDoc(doc: AdminCredDoc): Promise<void> {
  if (isDevEnvironment()) {
    const creds = devGet<Record<string, AdminCredDoc>>(ADMIN_CRED_KEY) ?? {};
    creds[doc.username.toLowerCase()] = doc;
    devSet(ADMIN_CRED_KEY, creds);
  } else {
    await collection("admin-credentials").updateOne(
      { username: doc.username.toLowerCase() },
      { $set: doc },
      { upsert: true },
    );
  }
}

const adminLoginLimiter1 = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  skip: () => isDevEnvironment(),
  message: { message: "Ketma-ket xatoliklar: 1 daqiqa kuting" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  keyGenerator: (req) => {
    const ip =
      (req.headers["cf-connecting-ip"] as string) ??
      (req.headers["x-forwarded-for"] as string) ??
      req.ip ??
      "255.255.255.255";
    return `admin-login-1m:${ip}`;
  },
});

const adminLoginLimiter2 = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  skip: () => isDevEnvironment(),
  message: { message: "Juda ko'p urinish: 10 daqiqa bloklandi!" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  keyGenerator: (req) => {
    const ip =
      (req.headers["cf-connecting-ip"] as string) ??
      (req.headers["x-forwarded-for"] as string) ??
      req.ip ??
      "255.255.255.255";
    return `admin-login-10m:${ip}`;
  },
});

router.post(
  "/admin/login",
  adminLoginLimiter2,
  adminLoginLimiter1,
  async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body as {
        username?: string;
        password?: string;
      };
      if (
        username === undefined ||
        username === "" ||
        password === undefined ||
        password === ""
      ) {
        res
          .status(400)
          .json(new TypeUZResponse("Username va parol majburiy", null));
        return;
      }

      const credDoc = await getAdminCredDoc(username);
      if (!credDoc) {
        res
          .status(401)
          .json(new TypeUZResponse("Username yoki parol noto'g'ri", null));
        return;
      }

      const match = await bcrypt.compare(password, credDoc.passwordHash);
      if (!match) {
        res
          .status(401)
          .json(new TypeUZResponse("Username yoki parol noto'g'ri", null));
        return;
      }

      const token = signToken({
        uid: credDoc.username,
        email: `${credDoc.username}@admin.typeuz.uz`,
        admin: true,
      });

      Logger.info(`Admin login: ${credDoc.username}`);
      res
        .status(200)
        .json(new TypeUZResponse("Admin kirish muvaffaqiyatli", { token }));
    } catch (e) {
      Logger.error(`Admin login error: ${(e as Error).message}`);
      res.status(500).json(new TypeUZResponse("Admin kirishda xatolik", null));
    }
  },
);

router.post("/admin/change-password", async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (
      currentPassword === undefined ||
      currentPassword === "" ||
      newPassword === undefined ||
      newPassword === ""
    ) {
      res
        .status(400)
        .json(new TypeUZResponse("Joriy va yangi parol majburiy", null));
      return;
    }

    if (newPassword.length < 8) {
      res
        .status(400)
        .json(
          new TypeUZResponse(
            "Yangi parol kamida 8 belgidan iborat bo'lishi kerak",
            null,
          ),
        );
      return;
    }

    const authHeader = req.headers.authorization;
    if (authHeader === undefined || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json(new TypeUZResponse("Avtorizatsiya talab qilinadi", null));
      return;
    }

    const jwtToken = authHeader.slice(7);
    let decoded: { uid: string; admin?: boolean };
    try {
      decoded = verifyToken(jwtToken);
    } catch {
      res.status(401).json(new TypeUZResponse("Yaroqsiz token", null));
      return;
    }

    if (!decoded.admin) {
      res
        .status(403)
        .json(
          new TypeUZResponse(
            "Faqat adminlar parolni o'zgartirishi mumkin",
            null,
          ),
        );
      return;
    }

    const username = decoded.uid;
    const credDoc = await getAdminCredDoc(username);
    if (!credDoc) {
      res.status(404).json(new TypeUZResponse("Admin topilmadi", null));
      return;
    }

    const match = await bcrypt.compare(currentPassword, credDoc.passwordHash);
    if (!match) {
      res.status(401).json(new TypeUZResponse("Joriy parol noto'g'ri", null));
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    credDoc.passwordHash = newHash;
    await saveAdminCredDoc(credDoc);

    Logger.info(`Admin password changed: ${username}`);
    res
      .status(200)
      .json(new TypeUZResponse("Parol muvaffaqiyatli o'zgartirildi", null));
  } catch (e) {
    Logger.error(`Admin change-password error: ${(e as Error).message}`);
    res
      .status(500)
      .json(new TypeUZResponse("Parolni o'zgartirishda xatolik", null));
  }
});

export default router;

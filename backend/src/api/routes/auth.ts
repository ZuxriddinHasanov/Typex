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
import { REQUEST_MULTIPLIER } from "../../middlewares/rate-limit";
import type { Gender } from "@typeuz/schemas/users";

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

type PwDoc = {
  uid: string;
  passwordHash: string;
  createdAt: number;
};

type UserMeta = {
  uid: string;
  email: string;
  name: string;
};

async function getPwDoc(uid: string): Promise<PwDoc | null> {
  if (isDevEnvironment()) {
    return devGet<PwDoc>(`pw_${uid}`);
  }
  return (await collection("user-passwords").findOne({ uid })) as PwDoc | null;
}

async function savePwDoc(doc: PwDoc): Promise<void> {
  if (isDevEnvironment()) {
    devSet(`pw_${doc.uid}`, doc);
  } else {
    await collection("user-passwords").insertOne(doc);
  }
}

async function findUserByEmail(email: string): Promise<UserMeta | null> {
  if (isDevEnvironment()) {
    const allUsers = devGet<Record<string, UserMeta>>("users_by_email") ?? {};
    return allUsers[email.toLowerCase()] ?? null;
  }
  const user = await UserDAL.findByEmail(email).catch(() => null);
  if (!user) return null;
  return { uid: user.uid, email: user.email, name: user.name };
}

async function findUserByName(name: string): Promise<UserMeta | null> {
  if (isDevEnvironment()) {
    const allByName = devGet<Record<string, UserMeta>>("users_by_name") ?? {};
    return allByName[name.toLowerCase()] ?? null;
  }
  const user = await UserDAL.findByName(name).catch(() => null);
  if (!user) return null;
  return { uid: user.uid, email: user.email, name: user.name };
}

async function saveUserMeta(meta: UserMeta): Promise<void> {
  if (isDevEnvironment()) {
    const allUsers = devGet<Record<string, UserMeta>>("users_by_email") ?? {};
    allUsers[meta.email.toLowerCase()] = meta;
    devSet("users_by_email", allUsers);
    const allByName = devGet<Record<string, UserMeta>>("users_by_name") ?? {};
    allByName[meta.name.toLowerCase()] = meta;
    devSet("users_by_name", allByName);
    // uid → user mapping for getUser(uid) calls
    const allByUid = devGet<Record<string, UserMeta>>("users_by_uid") ?? {};
    allByUid[meta.uid] = meta;
    devSet("users_by_uid", allByUid);
  }
}

router.post("/email/register", async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      email?: string;
      password?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      captcha?: string;
      gender?: string;
      age?: number;
      avatar?: string;
    };
    const {
      email,
      password,
      name,
      firstName,
      lastName,
      captcha: _captcha,
      gender,
      age,
      avatar,
    } = body;

    if (
      email === undefined ||
      email === "" ||
      password === undefined ||
      password === "" ||
      name === undefined ||
      name === ""
    ) {
      res
        .status(400)
        .json(new TypeUZResponse("Email, parol va username majburiy", null));
      return;
    }

    if (password.length < 8) {
      res
        .status(400)
        .json(
          new TypeUZResponse(
            "Parol kamida 8 belgidan iborat bo'lishi kerak",
            null,
          ),
        );
      return;
    }

    const existing = await findUserByEmail(email);
    if (existing !== null) {
      res
        .status(409)
        .json(
          new TypeUZResponse("Bu email allaqachon ro'yxatdan o'tgan", null),
        );
      return;
    }

    const uid = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, 10);

    await UserDAL.addUser(
      name,
      email,
      uid,
      gender as Gender,
      age,
      avatar,
      firstName,
      lastName,
    );
    await saveUserMeta({ uid, email, name });
    await savePwDoc({
      uid,
      passwordHash: hashedPassword,
      createdAt: Date.now(),
    });

    const token = signToken({ uid, email });

    res.status(201).json(
      new TypeUZResponse("Ro'yxatdan o'tish muvaffaqiyatli", {
        uid,
        email,
        name,
        token,
      }),
    );
  } catch (e) {
    Logger.error(`Register error: ${(e as Error).message}`);
    res
      .status(500)
      .json(new TypeUZResponse("Ro'yxatdan o'tishda xatolik", null));
  }
});

router.post("/email/login", async (req: Request, res: Response) => {
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

    const isEmail = email.includes("@");
    const user = isEmail
      ? await findUserByEmail(email)
      : await findUserByName(email);
    if (user === null) {
      res
        .status(401)
        .json(new TypeUZResponse("Email/username yoki parol noto'g'ri", null));
      return;
    }

    const pwDoc = await getPwDoc(user.uid);
    if (pwDoc === null) {
      res
        .status(401)
        .json(new TypeUZResponse("Email/username yoki parol noto'g'ri", null));
      return;
    }

    const match = await bcrypt.compare(password, pwDoc.passwordHash);
    if (!match) {
      res
        .status(401)
        .json(new TypeUZResponse("Email/username yoki parol noto'g'ri", null));
      return;
    }

    if (!isDevEnvironment()) {
      await UserDAL.updateLastLoginAt(user.uid).catch(() => {
        // Silently ignore
      });
    }

    const token = signToken({ uid: user.uid, email: user.email });
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
});

async function verifyGoogleToken(
  idToken: string,
): Promise<{ email: string; name: string } | null> {
  try {
    const resp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
    );
    if (!resp.ok) return null;
    const payload = (await resp.json()) as {
      email?: string;
      name?: string;
      email_verified?: string;
      sub?: string;
    };
    if (String(payload.email_verified) !== "true") {
      return null;
    }
    return {
      email: payload.email ?? "",
      name: payload.name ?? payload.email?.split("@")[0] ?? "google_user",
    };
  } catch {
    return null;
  }
}

router.post("/google", async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body as { idToken?: string };

    if (idToken === undefined || idToken === "") {
      res
        .status(400)
        .json(new TypeUZResponse("Google ID token majburiy", null));
      return;
    }

    const googleInfo = await verifyGoogleToken(idToken);
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
      const username = name ?? email.split("@")[0] ?? `user_${uid.slice(0, 8)}`;

      if (!isDevEnvironment()) {
        await UserDAL.addUser(username, email, uid);
      }
      await saveUserMeta({ uid, email, name: username });
      user = await findUserByEmail(email);
    }

    if (user === null) {
      res
        .status(500)
        .json(new TypeUZResponse("Foydalanuvchi yaratishda xatolik", null));
      return;
    }

    const token = signToken({ uid: user.uid, email: user.email });

    if (!isDevEnvironment()) {
      await UserDAL.updateLastLoginAt(user.uid).catch(() => {
        // Silently ignore
      });
    }

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

router.post("/github", async (req: Request, res: Response) => {
  try {
    const { code } = req.body as { code?: string };

    if (code === undefined || code === "") {
      res
        .status(400)
        .json(new TypeUZResponse("GitHub authorization code majburiy", null));
      return;
    }

    const GITHUB_CLIENT_ID = process.env["GITHUB_CLIENT_ID"] ?? "dev";
    const GITHUB_CLIENT_SECRET = process.env["GITHUB_CLIENT_SECRET"] ?? "dev";

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

    if (tokenData.access_token === undefined || tokenData.access_token === "") {
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

    const email = ghUser.email ?? `${ghUser.login ?? "gh_user"}@github.dev`;

    let user = await findUserByEmail(email);

    if (user === null) {
      const uid = crypto.randomUUID();
      const username = ghUser.login ?? `gh_${uid.slice(0, 8)}`;
      if (!isDevEnvironment()) {
        await UserDAL.addUser(username, email, uid);
      }
      await saveUserMeta({ uid, email, name: username });
      user = await findUserByEmail(email);
    }

    if (user === null) {
      res
        .status(500)
        .json(new TypeUZResponse("Foydalanuvchi yaratishda xatolik", null));
      return;
    }

    const token = signToken({ uid: user.uid, email: user.email });

    if (!isDevEnvironment()) {
      await UserDAL.updateLastLoginAt(user.uid).catch(() => {
        // Silently ignore
      });
    }

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
  const clientId = process.env["GITHUB_CLIENT_ID"] ?? "dev";
  const callbackUrl =
    process.env["GITHUB_REDIRECT_URI"] ??
    `${_req.protocol}://${_req.get("host") ?? _req.hostname}/auth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=user:email`;
  res.redirect(url);
});

router.get("/github/callback", async (req: Request, res: Response) => {
  const feUrl = (): string =>
    `${process.env["FRONTEND_URL"] ?? "https://typeuz.uz"}/auth-callback.html`;

  try {
    const { code } = req.query as { code?: string };
    const { error: errorParam } = req.query as { error?: string };

    if (errorParam !== undefined && errorParam !== "") {
      res.redirect(`${feUrl()}?auth_error=${errorParam}`);
      return;
    }

    if (code === undefined || code === "") {
      res.redirect(`${feUrl()}?auth_error=missing_code`);
      return;
    }

    const GITHUB_CLIENT_ID = process.env["GITHUB_CLIENT_ID"] ?? "dev";
    const GITHUB_CLIENT_SECRET = process.env["GITHUB_CLIENT_SECRET"] ?? "dev";

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
    if (tokenData.access_token === undefined || tokenData.access_token === "") {
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
    const email = ghUser.email ?? `${ghUser.login ?? "gh_user"}@github.dev`;

    let user = await findUserByEmail(email);
    if (user === null) {
      const uid = crypto.randomUUID();
      const username = ghUser.login ?? `gh_${uid.slice(0, 8)}`;
      if (!isDevEnvironment()) {
        await UserDAL.addUser(username, email, uid);
      }
      await saveUserMeta({ uid, email, name: username });
      user = await findUserByEmail(email);
    }

    if (user === null) {
      res.redirect(`${feUrl()}?auth_error=user_creation_failed`);
      return;
    }

    const token = signToken({ uid: user.uid, email: user.email });
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

const adminLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5 * REQUEST_MULTIPLIER,
  message: { message: "Ko'p urinishlar, keyinroq urinib ko'ring" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false, xForwardedForHeader: false },
  keyGenerator: (req) => {
    const ip =
      (req.headers["cf-connecting-ip"] as string) ??
      (req.headers["x-forwarded-for"] as string) ??
      req.ip ??
      "255.255.255.255";
    return `admin-login:${ip}`;
  },
});

router.post(
  "/admin/login",
  adminLoginLimiter,
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

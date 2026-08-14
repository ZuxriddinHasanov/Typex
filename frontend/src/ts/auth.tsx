import {
  Gender,
  NewPasswordSchema,
  PasswordSchema,
} from "@typeuz/schemas/users";
import { typedKeys } from "@typeuz/util/objects";
import { tryCatch } from "@typeuz/util/trycatch";
import { FirebaseError } from "firebase/app";
import {
  AuthProvider,
  EmailAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  linkWithCredential,
  linkWithPopup,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  unlink,
  updateEmail,
  updateProfile,
  User,
  User as UserType,
} from "firebase/auth";
import { createMemo } from "solid-js";
import { z, ZodString } from "zod";

import Ape from "./ape";
import { waitForPresetsReady } from "./collections/presets";
import { waitForTagsReady } from "./collections/tags";
import { updateFromServer as updateConfigFromServer } from "./config/remote";
import * as DB from "./db";
import { authEvent } from "./events/auth";
import {
  signOut as authSignOut,
  createUserWithEmailAndPassword,
  getAuthenticatedUser,
  isAuthAvailable,
  resetIgnoreAuthCallback,
  signInWithEmailAndPassword,
  signInWithPopup,
  Auth,
} from "./firebase";
import { createSignalWithSetters } from "./hooks/createSignalWithSetters";
import { createEffectOn } from "./hooks/effects";
import * as Sentry from "./sentry";
import {
  getUserId,
  isAuthenticated,
  setUserId,
  setUserVerified,
} from "./states/core";
import { hideLoaderBar, showLoaderBar } from "./states/loader-bar";
import {
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "./states/notifications";
import { FaObject } from "./types/font-awesome";
import {
  getStoredUser,
  getStoredToken,
  setStoredToken,
  setStoredUser,
} from "./utils/custom-auth";
import { isDevEnvironment } from "./utils/env";
import { createErrorMessage } from "./utils/error";
import { SnapshotInitError } from "./utils/snapshot-init-error";
import { OneOf } from "./utils/types";

type AuthMethodInfo = {
  display: string;
  fa: FaObject;
} & OneOf<{
  provider: AuthProvider;
  providerId: string;
}>;

/**
 * auth methods, keep order from most to least preferred.
 * This is used for reauthenticate
 */
const authMethods = {
  password: {
    display: "Password",
    providerId: "password",
    fa: { icon: "fa-lock" },
  },
  github: {
    display: "GitHub",
    provider: new GithubAuthProvider(),
    fa: { variant: "brand", icon: "fa-github" },
  },
  google: {
    display: "Google",
    provider: new GoogleAuthProvider(),
    fa: { variant: "brand", icon: "fa-google" },
  },
} as const satisfies Record<string, AuthMethodInfo>;

export type AuthMethod = keyof typeof authMethods;
export type ProviderAuthMethod = Exclude<AuthMethod, "password">;

export type AuthResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };

type ReauthSuccess = {
  status: "success";
  message: string;
  user: User;
};

type ReauthFailed = {
  status: "error" | "notice";
  message: string;
};

type ReauthenticateOptions = {
  excludeMethod?: AuthMethod;
  password?: string;
};

const [getAuthenticatedUserReactive, { updateAuthenticatedUser }] =
  createSignalWithSetters<Pick<User, "providerData"> | null>(null)({
    updateAuthenticatedUser: (set) => {
      const user = getAuthenticatedUser();
      if (user === null) {
        set(null);
      } else {
        set({ providerData: user.providerData });
      }
    },
  });
export { getAuthenticatedUser };

createEffectOn(getUserId, () => {
  updateAuthenticatedUser();
});

const authenticationMemos = Object.fromEntries(
  typedKeys(authMethods).map((authMethod) => {
    const memo = createMemo(() => {
      const providerId = getProviderId(authMethod);

      const user = getAuthenticatedUserReactive();
      if (user === null) return undefined;
      const result = {
        isInUse: user.providerData.some((p) => p.providerId === providerId),
        hasAdditionalAuthMethods: hasAdditionalAuthMethods(authMethod),
      };

      return result;
    });
    return [authMethod, memo];
  }),
);

export async function sendVerificationEmail(): Promise<void> {
  if (!isAuthAvailable()) {
    showErrorNotification("Authentication uninitialized", { durationMs: 3000 });
    return;
  }

  showLoaderBar();
  const response = await Ape.users.verificationEmail();
  if (response.status !== 200) {
    hideLoaderBar();
    showErrorNotification("Failed to request verification email", { response });
  } else {
    hideLoaderBar();
    showSuccessNotification("Verification email sent");
  }
}

async function getDataAndInit(): Promise<boolean> {
  try {
    console.log("getting account data");
    const snapshot = await DB.initSnapshot();
    //TODO: preload collections for now, remove when __nonReactive is removed from collections
    await waitForPresetsReady();
    await waitForTagsReady();

    if (snapshot === false) {
      throw new Error(
        "Snapshot didn't initialize due to lacking authentication even though user is authenticated",
      );
    }

    void Sentry.setUser(snapshot.uid, snapshot.name);

    await updateConfigFromServer();
    return true;
  } catch (error) {
    console.error(error);
    if (error instanceof SnapshotInitError) {
      if (error.responseCode === 429) {
        showNoticeNotification(
          "Doing so will save you bandwidth, make the next test be ready faster and will not sign you out (which could mean your new personal best would not save to your account).",
          {
            durationMs: 0,
          },
        );
        showNoticeNotification(
          "You will run into this error if you refresh the website to restart the test. It is NOT recommended to do that. Instead, use tab + enter or just tab (with quick tab mode enabled) to restart the test.",
          {
            durationMs: 0,
          },
        );
      }

      showErrorNotification(`Failed to get user data: ${error.message}`);
    } else {
      showErrorNotification("Failed to get user data", { error });
    }
    return false;
  }
}

export async function loadUser(_user: UserType): Promise<void> {
  if (!(await getDataAndInit())) {
    signOut();
    return;
  }
  authEvent.dispatch({ type: "snapshotUpdated", data: { isInitial: true } });
}

export async function onAuthStateChanged(
  authInitialisedAndConnected: boolean,
  user: UserType | null,
): Promise<void> {
  console.debug(`account controller ready`);

  let userPromise: Promise<void> = Promise.resolve();

  if (authInitialisedAndConnected) {
    console.debug(`auth state changed, user ${user ? "true" : "false"}`);
    if (user) {
      setUserId(user.uid);
      userPromise = loadUser(user);
    } else {
      setUserId(null);
      DB.setSnapshot(undefined);
    }
  }

  if (!authInitialisedAndConnected || !user) {
    void Sentry.clearUser();
  }

  authEvent.dispatch({
    type: "authStateChanged",
    data: { isUserSignedIn: user !== null, loadPromise: userPromise },
  });
}

export async function signIn(
  email: string,
  password: string,
  rememberMe: boolean,
  _captcha?: string,
): Promise<AuthResult> {
  if (Auth !== undefined) {
    const { error } = await tryCatch(
      signInWithEmailAndPassword(email, password, rememberMe),
    );
    if (error !== null) {
      return { success: false, message: error.message };
    }
    return { success: true };
  }

  const { loginWithEmail } = await import("./utils/custom-auth-api");
  const res = await loginWithEmail(email, password, rememberMe);
  if (!res.success) return { success: false, message: res.message };
  setUserVerified(true);
  await onAuthStateChanged(true, { uid: res.uid } as unknown as User);
  return { success: true };
}

export async function signInWithProvider(
  authMethod: AuthMethod,
  options: { rememberMe: boolean },
): Promise<AuthResult> {
  if (Auth !== undefined) {
    const provider = getAuthProvider(authMethod);
    if (provider === undefined) {
      return {
        success: false,
        message: `Authentication ${authMethod} is missing a provider`,
      };
    }

    const { error } = await tryCatch(
      signInWithPopup(provider, options.rememberMe),
    );
    if (error !== null) {
      return { success: false, message: error.message };
    }
    return { success: true };
  }

  if (authMethod === "google") {
    return signInWithGooglePopup(options.rememberMe);
  }

  if (authMethod === "github") {
    return signInWithGitHubPopup(options.rememberMe);
  }

  return { success: false, message: `Unsupported auth method: ${authMethod}` };
}

async function signInWithGooglePopup(rememberMe: boolean): Promise<AuthResult> {
  const envConfig = (await import("virtual:env-config")).envConfig;
  const GOOGLE_CLIENT_ID = envConfig.googleClientId;

  if (!GOOGLE_CLIENT_ID) {
    return {
      success: false,
      message:
        "Google login ishlab chiqish rejimida mavjud emas. Email orqali kiring yoki frontend/ .env faylida VITE_GOOGLE_CLIENT_ID sozlang.",
    };
  }

  return new Promise((resolve) => {
    const loadGoogle = () => {
      const win = window as unknown as {
        google?: {
          accounts?: {
            oauth2?: {
              initTokenClient: (config: Record<string, unknown>) => {
                requestAccessToken: () => void;
              };
            };
          };
        };
      };
      const tokenClient = win.google?.accounts?.oauth2?.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        callback: async (response: {
          access_token?: string;
          id_token?: string;
          error?: string;
        }) => {
          if (response.error !== undefined && response.error !== "") {
            resolve({
              success: false,
              message: `Google login: ${response.error}`,
            });
            return;
          }
          const idToken = response.id_token ?? response.access_token;
          if (idToken === undefined || idToken === "") {
            resolve({
              success: false,
              message: "Google login: token olinmadi",
            });
            return;
          }
          const backendUrl = (await import("virtual:env-config")).envConfig
            .backendUrl;
          try {
            const res = await fetch(`${backendUrl}/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: idToken }),
            });
            const json = (await res.json()) as {
              data?: {
                token: string;
                uid: string;
                email: string;
                name: string;
              };
              message?: string;
            };
            if (
              json.data !== undefined &&
              json.data.token !== undefined &&
              json.data.token !== ""
            ) {
              setStoredToken(json.data.token, rememberMe);
              setStoredUser({
                uid: json.data.uid,
                email: json.data.email,
                name: json.data.name,
              });
              void onAuthStateChanged(true, {
                uid: json.data.uid,
              } as unknown as User);
              resolve({ success: true });
            } else {
              resolve({
                success: false,
                message: json.message ?? "Google login failed",
              });
            }
          } catch {
            resolve({
              success: false,
              message: "Google login: backend xatosi",
            });
          }
        },
      });
      if (tokenClient === undefined) {
        resolve({
          success: false,
          message: "Google login yuklanmadi. Iltimos Adblockerni o'chiring.",
        });
        return;
      }
      tokenClient.requestAccessToken();
    };

    if (
      document.querySelector(
        "script[src='https://accounts.google.com/gsi/client']",
      )
    ) {
      loadGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = loadGoogle;
      script.onerror = () => {
        resolve({ success: false, message: "Google login library yuklanmadi" });
      };
      document.head.appendChild(script);
    }
  });
}

async function signInWithGitHubPopup(rememberMe: boolean): Promise<AuthResult> {
  const backendUrl = (await import("virtual:env-config")).envConfig.backendUrl;
  const popup = window.open(
    `${backendUrl}/auth/github/login`,
    "github-auth",
    "width=600,height=700",
  );
  if (!popup) {
    return {
      success: false,
      message: "Popup bloklandi. Brauzer sozlamalarini tekshiring.",
    };
  }

  return new Promise((resolve) => {
    const handler = (event: MessageEvent) => {
      const d = event.data as Record<string, unknown> | undefined;
      if (d === undefined || d["type"] !== "typeuz_oauth") return;
      window.removeEventListener("message", handler);
      if (
        d["success"] === true &&
        typeof d["token"] === "string" &&
        d["token"] !== ""
      ) {
        setStoredToken(d["token"], rememberMe);
        setStoredUser({
          uid: d["uid"] as string,
          email: d["email"] as string,
          name: d["name"] as string,
        });
        void onAuthStateChanged(true, {
          uid: d["uid"] as string,
        } as unknown as User);
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          message: (d["error"] as string) ?? "GitHub login failed",
        });
      }
    };
    window.addEventListener("message", handler);

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        window.removeEventListener("message", handler);
        resolve({ success: false, message: "Login oynasi yopildi" });
      }
    }, 500);
  });
}

export async function addAuthProvider(
  options:
    | { authMethod: ProviderAuthMethod }
    | {
        authMethod: "password";
        email: string;
        password: string;
      },
): Promise<void> {
  if (!isAuthAvailable()) {
    showErrorNotification("Authentication uninitialized", { durationMs: 3000 });
    return;
  }
  const authMethod = options.authMethod;

  const user = getAuthenticatedUser();
  const providerName = getAuthMethodDisplay(authMethod);

  if (!user) return;
  showLoaderBar();
  try {
    if (authMethod === "password") {
      await addPasswordProvider(user, options);
    } else {
      await addPopupProvider(user, options);
    }

    showSuccessNotification(`${providerName} authentication added`);
    updateAuthenticatedUser();
  } catch (error) {
    showErrorNotification(`Failed to add ${providerName} authentication`, {
      error,
    });
  } finally {
    hideLoaderBar();
  }
}

async function addPasswordProvider(
  user: User,
  options: {
    email: string;
    password: string;
  },
) {
  const reauth = await reauthenticate({ password: options.password });
  if (reauth.status !== "success") {
    throw new Error(reauth.message);
  }
  const credential = EmailAuthProvider.credential(
    options.email,
    options.password,
  );
  await linkWithCredential(reauth.user, credential);
  await updateEmail(user, options.email);
  const response = await Ape.users.updateEmail({
    body: {
      newEmail: options.email,
      previousEmail: reauth.user.email as string,
    },
  });
  if (response.status !== 200) {
    throw new Error(
      "Password authentication added but updating the database email failed. This shouldn't happen, please contact support. Error",
    );
  }
}

async function addPopupProvider(
  user: User,
  options: { authMethod: ProviderAuthMethod },
) {
  const authMethod = options.authMethod;
  const provider = getAuthProvider(authMethod);
  if (provider === undefined) {
    throw new Error(`Authentication ${authMethod} is missing a provider`);
  }

  await linkWithPopup(user, provider);
  authEvent.dispatch({ type: "authConfigUpdated" });
}

export async function removeAuthProvider(
  authMethod: AuthMethod,
  options?: { password?: string },
): Promise<ReauthSuccess | ReauthFailed> {
  const reauth = await reauthenticate({
    password: options?.password,
    excludeMethod: authMethod,
  });
  if (reauth.status !== "success") {
    return {
      status: reauth.status,
      message: reauth.message,
    };
  }
  try {
    await unlink(reauth.user, getProviderId(authMethod));
    updateAuthenticatedUser();
  } catch (e) {
    const message = createErrorMessage(
      e,
      authMethod === "password"
        ? "Failed to remove password authentication"
        : `Failed to unlink ${getAuthMethodDisplay(authMethod)} account`,
    );
    return {
      status: "error",
      message,
    };
  }
  return {
    status: "success",
    message: `${getAuthMethodDisplay(authMethod)} authentication removed`,
    user: reauth.user,
  };
}

export function signOut(): void {
  if (!isAuthAvailable()) {
    showErrorNotification("Authentication uninitialized", { durationMs: 3000 });
    return;
  }
  if (!isAuthenticated()) return;
  if (Auth === undefined) {
    void (async () => {
      const { customSignOut } = await import("./utils/custom-auth-api");
      customSignOut();
      setUserId(null);
      setUserVerified(false);
    })();
    return;
  }
  void authSignOut();
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  captchaToken: string,
  gender?: Gender,
  age?: number,
  avatar?: string,
  firstName?: string,
  lastName?: string,
): Promise<AuthResult> {
  if (Auth !== undefined) {
    try {
      const createdAuthUser = await createUserWithEmailAndPassword(
        email,
        password,
      );

      const signInResponse = await Ape.users.create({
        body: {
          name: name,
          firstName,
          lastName,
          captcha: captchaToken,
          email,
          uid: createdAuthUser.user.uid,
          gender,
          age,
          avatar,
        },
      });
      if (signInResponse.status !== 200) {
        throw new Error(`Failed to sign in: ${signInResponse.body.message}`);
      }

      await updateProfile(createdAuthUser.user, { displayName: name });
      await sendVerificationEmail();
      await onAuthStateChanged(true, createdAuthUser.user);
      resetIgnoreAuthCallback();

      showSuccessNotification("Account created");
      return { success: true };
    } catch (e) {
      let message = createErrorMessage(e, "Failed to create account");

      if (e instanceof Error) {
        if ("code" in e && e.code === "auth/email-already-in-use") {
          message = createErrorMessage(
            { message: "Email already in use" },
            "Failed to create account",
          );
        }
      }

      showErrorNotification(message);
      signOut();
      return { success: false, message };
    }
  }

  const { registerWithEmail } = await import("./utils/custom-auth-api");
  const res = await registerWithEmail(
    email,
    password,
    name,
    firstName,
    lastName,
    captchaToken,
    gender,
    age,
    avatar,
  );
  if (!res.success) {
    showErrorNotification(res.message);
    return { success: false, message: res.message };
  }
  setUserVerified(true);
  await onAuthStateChanged(true, { uid: res.uid } as unknown as User);
  showSuccessNotification("Account created");
  return { success: true };
}

export function getAuthProvider(
  authMethod: AuthMethod,
): AuthProvider | undefined {
  const info = authMethods[authMethod] as AuthMethodInfo;
  return info.provider;
}

export async function reauthenticate(
  options: ReauthenticateOptions,
): Promise<ReauthSuccess | ReauthFailed> {
  if (!isAuthAvailable()) {
    return {
      status: "error",
      message: "Authentication is not initialized",
    };
  }
  if (Auth === undefined) {
    if (options.password === undefined) {
      return {
        status: "notice",
        message: "Password missing",
      };
    }
    const { reauthenticateWithEmail } = await import("./utils/custom-auth-api");
    const result = await reauthenticateWithEmail(options.password);
    if (!result.success) {
      return {
        status: "notice",
        message: result.message,
      };
    }
    const storedUser = getStoredUser();
    return {
      status: "success",
      message: "Reauthenticated",
      user: {
        uid: storedUser?.uid ?? getUserId(),
        email: storedUser?.email ?? "",
      } as unknown as User,
    };
  }

  const user = getAuthenticatedUser();
  if (user === null) {
    return {
      status: "error",
      message: "User is not signed in",
    };
  }

  const authMethod = getPreferredAuthenticationMethod(options.excludeMethod);

  try {
    if (authMethod === undefined) {
      return {
        status: "error",
        message:
          "Failed to reauthenticate: there is no valid authentication present on the account.",
      };
    }

    if (authMethod === "password") {
      if (options.password === undefined) {
        return {
          status: "error",
          message: "Failed to reauthenticate using password: password missing.",
        };
      }
      const credential = EmailAuthProvider.credential(
        user.email as string,
        options.password,
      );
      await reauthenticateWithCredential(user, credential);
    } else {
      const provider = getAuthProvider(authMethod);
      if (provider === undefined) {
        return {
          status: "error",
          message: `Authentication ${authMethod} is missing a provider`,
        };
      }
      await reauthenticateWithPopup(user, provider);
    }

    return {
      status: "success",
      message: "Reauthenticated",
      user,
    };
  } catch (e) {
    const typedError = e as FirebaseError;
    if (typedError.code === "auth/wrong-password") {
      return {
        status: "notice",
        message: "Incorrect password",
      };
    } else if (typedError.code === "auth/invalid-credential") {
      return {
        status: "notice",
        message:
          "Password is incorrect or your account does not have password authentication enabled.",
      };
    } else {
      return {
        status: "error",
        message: `Failed to reauthenticate: ${
          typedError?.message ?? JSON.stringify(e)
        }`,
      };
    }
  }
}

function getPreferredAuthenticationMethod(
  exclude?: AuthMethod,
): AuthMethod | undefined {
  const filteredMethods = typedKeys(authMethods).filter((it) => it !== exclude);
  for (const method of filteredMethods) {
    if (isUsingAuthentication(method)) return method;
  }
  return undefined;
}

export function isUsingAuthentication(authMethod: AuthMethod): boolean {
  if (Auth === undefined && getStoredToken() !== null) {
    return authMethod === "password";
  }
  const providerId = getProviderId(authMethod);
  return (
    getAuthenticatedUser()?.providerData.some(
      (p) => p.providerId === providerId,
    ) ?? false
  );
}

export function isUsingAuthenticationReactive(authMethod: AuthMethod): boolean {
  return authenticationMemos[authMethod]?.()?.isInUse ?? false;
}

/**
 * Returns the Zod schema for password validation.
 *
 * Set `isNew: true` for registration/creation flows (strict rules).
 * Omit it for re-authentication flows (lenient: just non-empty).
 *
 * @param options - Set `isNew: true` for password creation/registration.
 * @returns A Zod string schema.
 */
export function getPasswordSchema(options?: { isNew: boolean }): ZodString {
  if (!options?.isNew) return PasswordSchema;
  if (isDevEnvironment()) return z.string().min(6);
  return NewPasswordSchema;
}

export function isUsingPasswordAuthentication(): boolean {
  return isUsingAuthentication("password");
}

export function hasAdditionalAuthMethods(authMethod: AuthMethod) {
  return typedKeys(authMethods).some(
    (it) => it !== authMethod && isUsingAuthentication(it),
  );
}

export function hasAdditionalAuthMethodsReactive(authMethod: AuthMethod) {
  return authenticationMemos[authMethod]?.()?.hasAdditionalAuthMethods ?? false;
}

export function getAuthMethodDisplay(authMethod: AuthMethod): string {
  return authMethods[authMethod].display;
}

export function getAuthMethodIcon(authMethod: AuthMethod): FaObject {
  return authMethods[authMethod].fa;
}

function getProviderId(authMethod: AuthMethod): string {
  const info = authMethods[authMethod];

  if ("provider" in info) {
    return info.provider.providerId;
  }
  return info.providerId;
}

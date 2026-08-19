import {
  FirebaseApp,
  FirebaseError,
  FirebaseOptions,
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";
import {
  getAuth,
  Auth as AuthType,
  User,
  setPersistence as firebaseSetPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signInWithPopup as firebaseSignInWithPopup,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  getIdToken as firebaseGetIdToken,
  UserCredential,
  AuthProvider,
  onAuthStateChanged,
  indexedDBLocalPersistence,
  getAdditionalUserInfo,
} from "firebase/auth";
import { promiseWithResolvers } from "./utils/misc";
import { isDevEnvironment } from "./utils/env";
import { createErrorMessage } from "./utils/error";

import {
  Analytics as AnalyticsType,
  getAnalytics as firebaseGetAnalytics,
} from "firebase/analytics";
import { tryCatch } from "@typeuz/util/trycatch";
import { googleSignUpEvent } from "./events/google-sign-up";
import { setUserId, setUserVerified } from "./states/core";
import { getDevAuth } from "./utils/dev-auth";
import { getStoredToken, getStoredUser } from "./utils/custom-auth";

let app: FirebaseApp | undefined;
let Auth: AuthType | undefined;

/**
 * ignore auth callback. This is used during signup with google/github where we need to create the user on the backend first.
 */
let ignoreAuthCallback: boolean = false;

type ReadyCallback = (success: boolean, user: User | null) => Promise<void>;
let readyCallback: ReadyCallback | undefined;

const { promise: authPromise, resolve: resolveAuthPromise } =
  promiseWithResolvers();

export async function init(callback: ReadyCallback): Promise<void> {
  try {
    let firebaseConfig: FirebaseOptions | null;

    firebaseConfig = (
      (await import("./constants/firebase-config")) as {
        firebaseConfig: FirebaseOptions;
      }
    ).firebaseConfig;

    // Custom auth is the supported fallback whenever Firebase is not configured.
    if (!firebaseConfig.apiKey?.startsWith("AIzaSy")) {
      if (isDevEnvironment()) {
        console.info("Dev: Firebase not configured — auth disabled");
      }
      app = undefined;
      Auth = undefined;

      const storedToken = getStoredToken();
      const storedUser = getStoredUser();
      if (storedToken !== null && storedUser !== null) {
        setUserState({ uid: storedUser.uid, emailVerified: true });
        await callback(true, {
          uid: storedUser.uid,
          email: storedUser.email,
        } as unknown as User);
      } else {
        const devAuth = getDevAuth();
        if (devAuth !== null) {
          setUserState({ uid: devAuth.uid, emailVerified: true });
          await callback(true, { uid: devAuth.uid } as unknown as User);
        } else {
          setUserState(null);
          await callback(false, null);
        }
      }
      return;
    }

    readyCallback = callback;
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    Auth = getAuth(app);

    const rememberMe =
      window.localStorage.getItem("firebasePersistence") === "LOCAL";
    await setPersistence(rememberMe, false);

    onAuthStateChanged(Auth, async (user) => {
      if (!ignoreAuthCallback) {
        if (user !== null) {
          try {
            const idToken = await user.getIdToken();
            const backendUrl = (await import("virtual:env-config")).envConfig
              .backendUrl;
            const res = await fetch(`${backendUrl}/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });
            const json = (await res.json()) as {
              data?: {
                token: string;
                uid: string;
                email: string;
                name: string;
              };
            };
            if (
              json.data !== undefined &&
              json.data.token !== undefined &&
              json.data.token !== ""
            ) {
              const { setStoredToken, setStoredUser } =
                await import("./utils/custom-auth");
              setStoredToken(json.data.token, rememberMe);
              setStoredUser({
                uid: json.data.uid,
                email: json.data.email,
                name: json.data.name,
              });
            }
          } catch {
            // Silently ignore
          }
        }
        setUserState(user);
        await callback(true, user);
      }
    });
  } catch (e) {
    app = undefined;
    Auth = undefined;
    console.error("Firebase failed to initialize", e);
    await callback(false, null);
    setUserState(null);
  } finally {
    resolveAuthPromise();
  }
}

/**
 *
 * @returns the current user if authenticated, else `null`
 */
export function getAuthenticatedUser(): User | null {
  if (Auth?.currentUser) return Auth.currentUser;
  const user = getStoredUser();
  if (user !== null) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.name,
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: "",
      tenantId: null,
      delete: async () => undefined,
      getIdToken: async () => getStoredToken() ?? "",
      getIdTokenResult: async () => ({} as never),
      reload: async () => undefined,
      toJSON: () => ({}),
      phoneNumber: null,
      photoURL: null,
      providerId: "custom",
    } as unknown as User;
  }
  const devAuth = getDevAuth();
  if (devAuth !== null) {
    return {
      uid: devAuth.uid,
      emailVerified: true,
      getIdToken: async () => "",
      providerData: [],
    } as unknown as User;
  }
  return null;
}

export function getAnalytics(): AnalyticsType {
  return firebaseGetAnalytics(app);
}

export function isAuthAvailable(): boolean {
  return Auth !== undefined || getStoredToken() !== null;
}

export async function signOut(): Promise<void> {
  console.log("auth signout");
  await Auth?.signOut();
}

export async function signInWithEmailAndPassword(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<UserCredential> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  await setPersistence(rememberMe, true);

  const { data: result, error } = await tryCatch(
    firebaseSignInWithEmailAndPassword(Auth, email, password),
  );
  if (error !== null) {
    console.error(error);
    throw translateFirebaseError(
      error,
      "Failed to sign in with email and password",
    );
  }

  return result;
}

export function setUserState(
  options: {
    uid: string;
    emailVerified: boolean;
  } | null,
): void {
  if (options === null) {
    setUserId(null);
    setUserVerified(false);
  } else {
    setUserId(options.uid);
    setUserVerified(options.emailVerified);
  }
}

export async function signInWithPopup(
  provider: AuthProvider,
  rememberMe: boolean,
): Promise<void> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  await setPersistence(rememberMe, true);
  ignoreAuthCallback = true;

  const { data: signedInUser, error } = await tryCatch(
    firebaseSignInWithPopup(Auth, provider),
  );
  if (error !== null) {
    ignoreAuthCallback = false;
    console.log(error);
    throw translateFirebaseError(error, "Failed to sign in with popup");
  }
  const additionalUserInfo = getAdditionalUserInfo(signedInUser);
  if (additionalUserInfo?.isNewUser) {
    googleSignUpEvent.dispatch({ signedInUser, isNewUser: true });
  } else {
    setUserState(signedInUser.user);
    ignoreAuthCallback = false;
    await readyCallback?.(true, signedInUser.user);
  }
}

export async function createUserWithEmailAndPassword(
  email: string,
  password: string,
): Promise<UserCredential> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  ignoreAuthCallback = true;
  const result = await firebaseCreateUserWithEmailAndPassword(
    Auth,
    email,
    password,
  );

  return result;
}

export async function getIdToken(): Promise<string | null> {
  const user = getAuthenticatedUser();
  if (user === null) return null;
  return user.getIdToken();
}
async function setPersistence(
  rememberMe: boolean,
  store = false,
): Promise<void> {
  if (Auth === undefined) throw new Error("Authentication uninitialized");
  const persistence = rememberMe
    ? indexedDBLocalPersistence
    : browserSessionPersistence;

  if (store) {
    window.localStorage.setItem(
      "firebasePersistence",
      rememberMe ? "LOCAL" : "SESSION",
    );
  }

  await firebaseSetPersistence(Auth, persistence);
}

function translateFirebaseError(
  error: Error | FirebaseError,
  defaultMessage: string,
): Error {
  let message = createErrorMessage(error, defaultMessage);

  if (error instanceof FirebaseError) {
    if (error.code === "auth/wrong-password") {
      message = "Incorrect password";
    } else if (error.code === "auth/user-not-found") {
      message = "User not found";
    } else if (error.code === "auth/invalid-email") {
      message =
        "Invalid email format (make sure you are using your email to login - not your username)";
    } else if (error.code === "auth/invalid-credential") {
      message =
        "Email/password is incorrect or your account does not have password authentication enabled.";
    } else if (error.code === "auth/popup-closed-by-user") {
      message = "Popup closed by user";
    } else if (error.code === "auth/popup-blocked") {
      message =
        "Sign in popup was blocked by the browser. Check the address bar for a blocked popup icon, or update your browser settings to allow popups.";
    } else if (error.code === "auth/user-cancelled") {
      message = "Cancelled by user";
    } else if (error.code === "auth/account-exists-with-different-credential") {
      message =
        "Account already exists, but its using a different authentication method. Try signing in with a different method";
    } else {
      message = `Firebase error: ${error.code}`;
    }
  }

  return new Error(message, { cause: error });
}

export function resetIgnoreAuthCallback(): void {
  ignoreAuthCallback = false;
}

export { authPromise };
export { Auth };

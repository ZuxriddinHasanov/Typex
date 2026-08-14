import { envConfig } from "virtual:env-config";
import {
  clearStoredToken,
  getStoredToken,
  isStoredTokenPersistent,
  setStoredToken,
  setStoredUser,
} from "./custom-auth";

const backendUrl = (): string => envConfig.backendUrl;

export type AuthResult = {
  success: boolean;
  message: string;
  uid?: string;
  email?: string;
  name?: string;
};

export async function registerWithEmail(
  email: string,
  password: string,
  name: string,
  firstName?: string,
  lastName?: string,
  captcha?: string,
  gender?: string,
  age?: number,
  avatar?: string,
): Promise<AuthResult> {
  try {
    const res = await fetch(`${backendUrl()}/auth/email/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name,
        firstName,
        lastName,
        captcha,
        gender,
        age,
        avatar,
      }),
    });
    const json = (await res.json()) as {
      message: string;
      data?: { uid: string; email: string; name: string; token: string };
    };
    if (!res.ok) return { success: false, message: json.message };

    if (json.data) {
      setStoredToken(json.data.token);
      setStoredUser({
        uid: json.data.uid,
        email: json.data.email,
        name: json.data.name,
      });
      return {
        success: true,
        message: json.message,
        uid: json.data.uid,
        email: json.data.email,
        name: json.data.name,
      };
    }
    return { success: false, message: json.message };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

export async function loginWithEmail(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<AuthResult> {
  try {
    const res = await fetch(`${backendUrl()}/auth/email/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = (await res.json()) as {
      message: string;
      data?: { uid: string; email: string; name: string; token: string };
    };
    if (!res.ok) return { success: false, message: json.message };

    if (json.data) {
      setStoredToken(json.data.token, rememberMe);
      setStoredUser({
        uid: json.data.uid,
        email: json.data.email,
        name: json.data.name,
      });
      return {
        success: true,
        message: json.message,
        uid: json.data.uid,
        email: json.data.email,
        name: json.data.name,
      };
    }
    return { success: false, message: json.message };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

export async function reauthenticateWithEmail(
  password: string,
): Promise<AuthResult> {
  try {
    const token = getStoredToken();
    if (token === null) {
      return { success: false, message: "Authentication token not found" };
    }
    const res = await fetch(`${backendUrl()}/auth/email/reauthenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });
    const json = (await res.json()) as {
      message: string;
      data?: { uid: string; email: string; name: string; token: string };
    };
    if (!res.ok || json.data === undefined) {
      return { success: false, message: json.message };
    }
    setStoredToken(json.data.token, isStoredTokenPersistent());
    setStoredUser({
      uid: json.data.uid,
      email: json.data.email,
      name: json.data.name,
    });
    return {
      success: true,
      message: json.message,
      uid: json.data.uid,
      email: json.data.email,
      name: json.data.name,
    };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

export async function loginWithGoogle(
  idToken: string,
  email: string,
  name?: string,
): Promise<AuthResult> {
  try {
    const res = await fetch(`${backendUrl()}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, email, name }),
    });
    const json = (await res.json()) as {
      message: string;
      data?: { uid: string; email: string; name: string; token: string };
    };
    if (!res.ok) return { success: false, message: json.message };

    if (json.data) {
      setStoredToken(json.data.token);
      setStoredUser({
        uid: json.data.uid,
        email: json.data.email,
        name: json.data.name,
      });
      return {
        success: true,
        message: json.message,
        uid: json.data.uid,
        email: json.data.email,
        name: json.data.name,
      };
    }
    return { success: false, message: json.message };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

export async function loginWithGithub(code: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${backendUrl()}/auth/github`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = (await res.json()) as {
      message: string;
      data?: { uid: string; email: string; name: string; token: string };
    };
    if (!res.ok) return { success: false, message: json.message };

    if (json.data) {
      setStoredToken(json.data.token);
      setStoredUser({
        uid: json.data.uid,
        email: json.data.email,
        name: json.data.name,
      });
      return {
        success: true,
        message: json.message,
        uid: json.data.uid,
        email: json.data.email,
        name: json.data.name,
      };
    }
    return { success: false, message: json.message };
  } catch (e) {
    return { success: false, message: (e as Error).message };
  }
}

export function customSignOut(): void {
  clearStoredToken();
}

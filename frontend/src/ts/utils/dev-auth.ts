const DEV_AUTH_KEY = "devAuth";

import { envConfig } from "virtual:env-config";

export type DevAuth = { uid: string; email: string; name: string };

export function getDevAuth(): DevAuth | null {
  const raw = localStorage.getItem(DEV_AUTH_KEY);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as DevAuth;
  } catch {
    return null;
  }
}

export function setDevAuth(auth: DevAuth): void {
  localStorage.setItem(DEV_AUTH_KEY, JSON.stringify(auth));
}

export function clearDevAuth(): void {
  localStorage.removeItem(DEV_AUTH_KEY);
}

export async function devLogin(username: string): Promise<DevAuth> {
  const backendUrl = envConfig.backendUrl;
  const res = await fetch(`${backendUrl}/dev/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error("Dev login failed");
  const json: { data: DevAuth } = (await res.json()) as { data: DevAuth };
  const data = json.data;
  setDevAuth(data);
  return data;
}

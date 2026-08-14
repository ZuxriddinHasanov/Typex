const TOKEN_KEY = "typeuz_token";
const USER_KEY = "typeuz_user";

export type CustomAuthUser = {
  uid: string;
  email: string;
  name: string;
};

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function isStoredTokenPersistent(): boolean {
  return localStorage.getItem(TOKEN_KEY) !== null;
}

export function setStoredToken(token: string, persistent = true): void {
  const target = persistent ? localStorage : sessionStorage;
  const other = persistent ? sessionStorage : localStorage;
  other.removeItem(TOKEN_KEY);
  other.removeItem(USER_KEY);
  target.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getStoredUser(): CustomAuthUser | null {
  const raw =
    localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as CustomAuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: CustomAuthUser): void {
  const target =
    localStorage.getItem(TOKEN_KEY) === null ? sessionStorage : localStorage;
  target.setItem(USER_KEY, JSON.stringify(user));
}

export function isCustomAuthAvailable(): boolean {
  return getStoredToken() !== null;
}

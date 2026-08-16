import fs from "fs";
import path from "path";
import { isDevEnvironment } from "./misc";

function getDataDir(): string {
  const dirs = [
    path.join(process.cwd(), "backend", ".dev-data"),
    path.join(process.cwd(), ".dev-data"),
    path.join(__dirname, "../../.dev-data"),
    path.join(__dirname, "../../../backend/.dev-data"),
    "/tmp/.dev-data",
  ];
  for (const dir of dirs) {
    try {
      if (fs.existsSync(dir) && fs.readdirSync(dir).length > 0) {
        return dir;
      }
    } catch {
      continue;
    }
  }
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch {
      continue;
    }
  }
  return dirs[0] ?? path.join(process.cwd(), ".dev-data");
}

const DATA_DIR = getDataDir();

function ensureDir(): void {
  if (!isDevEnvironment()) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(key: string): string {
  return path.join(DATA_DIR, `${key}.json`);
}

export function devGet<T>(key: string): T | null {
  if (!isDevEnvironment()) return null;
  try {
    ensureDir();
    const fp = filePath(key);
    if (!fs.existsSync(fp)) return null;
    const raw = fs.readFileSync(fp, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function devSet(key: string, value: unknown): void {
  if (!isDevEnvironment()) return;
  ensureDir();
  const fp = filePath(key);
  fs.writeFileSync(fp, JSON.stringify(value, null, 2));
}

export function devDelete(key: string): void {
  if (!isDevEnvironment()) return;
  try {
    const fp = filePath(key);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  } catch {
    // ignore
  }
}

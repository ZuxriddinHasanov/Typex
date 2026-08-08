import { createSignal } from "solid-js";
import { ColorName, Theme } from "../constants/themes";
import { ThemeName } from "@typeuz/schemas/configs";

export type ThemeIdentifier = ThemeName | "custom";
const defaultTheme: Theme & { name: ThemeIdentifier } = {
  name: "typeuz_light",
  bg: "#ffffff",
  main: "#f97316",
  caret: "#f97316",
  sub: "#6b7280",
  subAlt: "#f5f5f6",
  text: "#1a1a1a",
  error: "#ef4444",
  errorExtra: "#b91c1c",
  colorfulError: "#ef4444",
  colorfulErrorExtra: "#b91c1c",
};

export const [getTheme, setTheme] = createSignal(defaultTheme);

export function updateThemeColor(key: ColorName, color: string): void {
  setTheme((prev) => ({
    ...prev,
    [key]: color,
  }));
}

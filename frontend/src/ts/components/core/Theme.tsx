import { Meta, MetaProvider, Style } from "@solidjs/meta";
import { createDebouncedEffectOn } from "../../hooks/effects";
import { useRefWithUtils } from "../../hooks/useRefWithUtils";
import { getTheme } from "../../states/theme";
import { FavIcon } from "./FavIcon";

function isLightColor(hex: string): boolean {
  if (hex === undefined || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

const GRID_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M 40 0 L 0 0 0 40' fill='none' stroke='rgba(0,0,0,0.06)' stroke-width='1'/%3E%3C/svg%3E")`;

export function Theme() {
  const [styleRef, styleEl] = useRefWithUtils<HTMLStyleElement>();

  createDebouncedEffectOn(125, getTheme, (colors) => {
    const grid = isLightColor(colors.bg) ? GRID_SVG : "none";
    styleEl()?.setHtml(`
:root {
    --bg-color: ${colors.bg};
    --main-color: ${colors.main};
    --caret-color: ${colors.caret};
    --sub-color: ${colors.sub};
    --sub-alt-color: ${colors.subAlt};
    --text-color: ${colors.text};
    --error-color: ${colors.error};
    --error-extra-color: ${colors.errorExtra};
    --colorful-error-color: ${colors.colorfulError};
    --colorful-error-extra-color: ${colors.colorfulErrorExtra};
}
body {
    background-image: ${grid};
}`);
  });

  return (
    <MetaProvider>
      <Style id="theme" ref={styleRef} />
      <Meta id="metaThemeColor" name="theme-color" content={getTheme().bg} />
      <FavIcon theme={getTheme()} />
    </MetaProvider>
  );
}

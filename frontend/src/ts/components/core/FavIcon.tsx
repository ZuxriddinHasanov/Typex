import { Link } from "@solidjs/meta";
import { createMemo, JSXElement } from "solid-js";

import { Theme } from "../../constants/themes";
import { isDevEnvironment } from "../../utils/env";

export function FavIcon(props: { theme: Theme }): JSXElement {
  const icon = createMemo<string>(() => {
    let { main, bg } = props.theme;
    if (isDevEnvironment()) {
      [main, bg] = [bg, main];
    }
    if (bg === main) {
      bg = "#111";
      main = "#eee";
    }

    const svgPre = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="fg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${main}"/>
          <stop offset="100%" stop-color="${main}" stop-opacity="0.7"/>
        </linearGradient>
      </defs>
      <rect fill="${bg}" width="64" height="64" rx="14"/>
      <rect x="4" y="4" width="56" height="56" rx="12" fill="none" stroke="url(#fg)" stroke-width="1.5" opacity="0.2"/>
      
    </svg>
    `;
    return "/images/favicon.svg";
  });

  return (
    <Link id="favicon" rel="shortcut icon" type="image/svg+xml" href={icon()} />
  );
}


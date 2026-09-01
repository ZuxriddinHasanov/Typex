import { Link } from "@solidjs/meta";
import { createMemo, JSXElement } from "solid-js";

import { Theme } from "../../constants/themes";
import { isColorDark } from "../../utils/colors";
import { isDevEnvironment } from "../../utils/env";

export function FavIcon(props: { theme: Theme }): JSXElement {
  const isDark = createMemo(() => {
    let bg = props.theme.bg;
    if (isDevEnvironment()) {
      bg = props.theme.main;
    }
    return isColorDark(bg);
  });

  const iconPng = createMemo(() =>
    isDark() ? "/images/favicon-dark.png" : "/images/favicon-light.png",
  );
  const iconSvg = createMemo(() =>
    isDark() ? "/images/favicon-dark.svg" : "/images/favicon-light.svg",
  );

  return (
    <>
      <Link id="favicon-svg" rel="icon" type="image/svg+xml" href={iconSvg()} />
      <Link id="favicon-apple" rel="apple-touch-icon" href={iconPng()} />
    </>
  );
}

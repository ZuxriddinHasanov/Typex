import { JSXElement, createMemo } from "solid-js";

import { restartTestEvent } from "../../../events/test";
import { getActivePage } from "../../../states/core";
import { getTheme } from "../../../states/theme";
import { isColorDark } from "../../../utils/colors";

export function Logo(): JSXElement {
  const isDark = createMemo(() => isColorDark(getTheme().bg));

  return (
    <a
      href="/"
      aria-label="TypeUZ Home"
      class="group flex items-center transition-transform duration-300 hover:scale-[1.02]"
      router-link
      data-ui-element="logo"
      onClick={() => {
        if (getActivePage() === "test") restartTestEvent.dispatch();
      }}
    >
      <img src={isDark() ? "/images/logo2.png" : "/images/logo.png"} alt="TypeUZ Logo" class="h-14 sm:h-16 w-auto object-contain" />
    </a>
  );
}

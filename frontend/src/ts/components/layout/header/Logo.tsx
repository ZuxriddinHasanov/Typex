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
      class="group flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
      router-link
      data-ui-element="logo"
      onClick={() => {
        if (getActivePage() === "test") restartTestEvent.dispatch();
      }}
    >
      <img src={isDark() ? "/images/logo2.jpeg" : "/images/logo.jpeg"} alt="TypeUZ Logo" class="h-10 w-auto rounded-lg object-contain" />
    </a>
  );
}

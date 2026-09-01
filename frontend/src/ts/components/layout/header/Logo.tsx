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
      aria-label="TypeX Home"
      class="group flex items-center transition-transform duration-300 hover:scale-[1.02]"
      router-link
      data-ui-element="logo"
      onClick={() => {
        if (getActivePage() === "test") restartTestEvent.dispatch();
      }}
    >
      <img
        src={
          isDark() ? "/images/favicon-dark.svg" : "/images/favicon-light.svg"
        }
        alt="TypeX Logo"
        class="h-24 w-auto object-contain sm:h-28"
      />
    </a>
  );
}

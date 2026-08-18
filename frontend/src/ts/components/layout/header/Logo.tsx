import { JSXElement } from "solid-js";

import { restartTestEvent } from "../../../events/test";
import { getActivePage } from "../../../states/core";

export function Logo(): JSXElement {
  return (
    <a
      href="/"
      aria-label="TypeX Home"
      class="group flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02]"
      router-link
      data-ui-element="logo"
      onClick={() => {
        if (getActivePage() === "test") restartTestEvent.dispatch();
      }}
    >
      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-main to-main/70 text-sm leading-none font-black tracking-tight text-bg shadow-sm">
        TX
      </span>
      <div class="text-2xl sm:text-3xl font-black tracking-tight text-text">
        TypeX<span class="text-main">.uz</span>
      </div>
    </a>
  );
}

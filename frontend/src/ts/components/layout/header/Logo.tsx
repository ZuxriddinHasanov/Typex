import { JSXElement } from "solid-js";

import { restartTestEvent } from "../../../events/test";
import { getActivePage } from "../../../states/core";

export function Logo(): JSXElement {
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
        src="/images/favicon.svg"
        alt="TypeX Logo"
        class="mr-3 h-8 w-auto object-contain sm:h-10"
      />
      <span class="text-2xl font-bold text-text">TypeX</span>
    </a>
  );
}

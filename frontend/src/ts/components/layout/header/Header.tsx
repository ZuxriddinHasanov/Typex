import { JSXElement, Show } from "solid-js";

import { getActivePage, getIsScreenshotting } from "../../../states/core";
import { isTestActive as getIsTestActive } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { Logo } from "./Logo";
import { Nav } from "./Nav";

export function Header(): JSXElement {
  return (
    <Show when={!getActivePage().startsWith("admin")}>
      <div
        class={cn(
          "sticky top-0 z-50 w-full border-b border-sub/10 bg-bg/90 backdrop-blur-xl transition-all duration-300",
          getIsTestActive() || getIsScreenshotting()
            ? "pointer-events-none -translate-y-full opacity-0"
            : "opacity-100",
        )}
      >
        <header class="mx-auto flex w-full max-w-[1300px] items-center justify-between px-6 py-3.5">
          <Logo />
          <Nav />
        </header>
      </div>
    </Show>
  );
}

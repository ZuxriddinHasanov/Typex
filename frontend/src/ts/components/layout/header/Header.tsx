import { JSXElement, Show } from "solid-js";

import { getActivePage, getIsScreenshotting } from "../../../states/core";
import { isTestActive as getIsTestActive } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { Logo } from "./Logo";
import { Nav } from "./Nav";

export function Header(): JSXElement {
  return (
    <Show
      when={!getActivePage().startsWith("admin")}
    >
      <div
        class={cn(
          "fixed top-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 rounded-2xl border border-sub/10 bg-bg/80 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-500",
          getIsTestActive() || getIsScreenshotting()
            ? "pointer-events-none -translate-y-[150%] opacity-0"
            : "opacity-100",
        )}
      >
        <header class="mx-auto flex w-full items-center justify-between px-6 py-4">
          <Logo />
          <Nav />
        </header>
      </div>
    </Show>
  );
}

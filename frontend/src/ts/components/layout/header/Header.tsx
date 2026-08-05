import { JSXElement, Show } from "solid-js";

import { getActivePage, getIsScreenshotting } from "../../../states/core";
import { isTestActive as getIsTestActive } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { Logo } from "./Logo";
import { Nav } from "./Nav";

export function Header(): JSXElement {
  return (
    <Show
      when={
        getActivePage() !== "adminLogin" && getActivePage() !== "adminDashboard"
      }
    >
      <div
        class={cn(
          "w-full transition-opacity duration-500",
          getIsTestActive() || getIsScreenshotting() ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <header class="mx-auto flex w-full max-w-6xl items-center justify-between border-b border-sub/10 px-6 py-4">
          <Logo />
          <Nav />
        </header>
      </div>
    </Show>
  );
}

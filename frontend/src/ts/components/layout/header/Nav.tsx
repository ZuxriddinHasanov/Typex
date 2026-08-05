import { JSXElement, Show } from "solid-js";
import { isAuthenticated } from "../../../states/core";
import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import type { ThemeName } from "@typeuz/schemas/configs";

import { Fa } from "../../common/Fa";

export function Nav(): JSXElement {
  return (
    <nav class="flex items-center gap-1">
      <a
        href="/"
        class="rounded-lg px-3 py-2 text-sm font-medium transition-colors text-sub hover:text-text"
        router-link
        data-nav-item="home"
      >Bosh</a>
      <a
        href="/test"
        class="rounded-lg px-3 py-2 text-sm font-medium transition-colors text-sub hover:text-text"
        router-link
        data-nav-item="test"
      >Test</a>
      <a
        href="/leaderboards"
        class="rounded-lg px-3 py-2 text-sm font-medium transition-colors text-sub hover:text-text"
        router-link
        data-nav-item="leaderboards"
      >Reyting</a>
      <a
        href="/about"
        class="rounded-lg px-3 py-2 text-sm font-medium transition-colors text-sub hover:text-text"
        router-link
        data-nav-item="about"
      >Haqida</a>
      <button
        type="button"
        onClick={() => {
          const isDark = getConfig.theme === "typeuz";
          setConfig("theme", (isDark ? "typeuz_light" : "typeuz") as ThemeName);
        }}
        class="ml-2 flex h-9 w-9 items-center justify-center rounded-full text-sub transition-all duration-300 hover:bg-sub-alt hover:text-text"
        aria-label="Toggle theme"
      >
        <Fa icon={getConfig.theme === "typeuz" ? "fa-sun" : "fa-moon"} class="transition-all duration-300" />
      </button>
      <Show
        when={isAuthenticated()}
        fallback={
          <a
            href="/login"
            class="ml-2 rounded-full bg-main px-5 py-2 text-sm font-semibold text-bg transition-all hover:scale-105"
            router-link
            data-nav-item="login"
          >
            Kirish
          </a>
        }
      >
        <a
          href="/account"
          class="ml-2 flex items-center gap-2 rounded-full bg-sub-alt/50 px-4 py-2 text-sm font-semibold text-text transition-all hover:bg-sub-alt hover:scale-105"
          router-link
        >
          <Fa icon="fa-user" />
          Profil
        </a>
      </Show>
    </nav>
  );
}

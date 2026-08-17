import type { ThemeName } from "@typeuz/schemas/configs";

import { JSXElement, Show } from "solid-js";

import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { isAuthenticated, getActivePage } from "../../../states/core";
import {
  changeUiLanguage,
  getUiLanguage,
  t,
  type UILanguage,
} from "../../../states/ui-language";
import { cn } from "../../../utils/cn";
import { Fa } from "../../common/Fa";

const navItemClass = (page: string) =>
  cn(
    "rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200",
    getActivePage() === page
      ? "bg-main/15 text-main"
      : "text-sub hover:scale-[1.02] hover:bg-sub-alt/50 hover:text-text",
  );

export function Nav(): JSXElement {
  return (
    <nav class="flex items-center gap-1">
      <a
        href="/landing"
        class={navItemClass("landing")}
        router-link
        data-nav-item="landing"
      >
        <Fa icon="fa-home" class="mr-2" />
        {t("nav.home")}
      </a>
      <a href="/" class={navItemClass("test")} router-link data-nav-item="test">
        <Fa icon="fa-keyboard" class="mr-2" />
        {t("nav.test")}
      </a>
      <a
        href="/leaderboards"
        class={navItemClass("leaderboards")}
        router-link
        data-nav-item="leaderboards"
      >
        <Fa icon="fa-crown" class="mr-2" />
        {t("nav.leaderboard")}
      </a>
      <a
        href="/about"
        class={navItemClass("about")}
        router-link
        data-nav-item="about"
      >
        <Fa icon="fa-info-circle" class="mr-2" />
        {t("nav.about")}
      </a>
      <button
        type="button"
        onClick={() => {
          const isDark = getConfig.theme === "typeuz";
          setConfig("theme", (isDark ? "typeuz_light" : "typeuz") as ThemeName);
        }}
        class="ml-2 flex h-9 w-9 items-center justify-center rounded-full text-sub transition-all duration-300 hover:bg-sub-alt hover:text-text"
        aria-label="Toggle theme"
      >
        <Fa
          icon={getConfig.theme === "typeuz" ? "fa-sun" : "fa-moon"}
          class="transition-all duration-300"
        />
      </button>
      <select
        onChange={(e) => changeUiLanguage(e.currentTarget.value as UILanguage)}
        class="ml-2 h-9 cursor-pointer rounded-full bg-sub-alt/30 px-3 text-xs font-bold text-sub uppercase transition-all outline-none hover:bg-sub-alt/60 hover:text-text"
        aria-label="Select language"
      >
        <option value="uzbek" selected={getUiLanguage() === "uzbek"}>
          UZ
        </option>
        <option value="english" selected={getUiLanguage() === "english"}>
          EN
        </option>
        <option value="russian" selected={getUiLanguage() === "russian"}>
          RU
        </option>
      </select>
      <Show
        when={isAuthenticated()}
        fallback={
          <a
            href="/login"
            class="ml-2 rounded-full bg-main px-5 py-2 text-sm font-semibold text-bg transition-all hover:scale-105"
            router-link
            data-nav-item="login"
          >
            {t("nav.login")}
          </a>
        }
      >
        <a
          href="/account"
          class={cn(
            "ml-2 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105",
            getActivePage() === "account"
              ? "bg-main text-bg"
              : "bg-sub-alt/50 text-text hover:bg-sub-alt",
          )}
          router-link
        >
          <Fa icon="fa-user" />
          {t("nav.profile")}
        </a>
      </Show>
    </nav>
  );
}

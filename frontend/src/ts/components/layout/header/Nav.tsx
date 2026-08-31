import type { ThemeName } from "@typeuz/schemas/configs";

import { JSXElement, Show } from "solid-js";
import { NotificationBubble } from "../../common/NotificationBubble";
import { hasUnreadInbox, unreadInboxCount } from "../../../collections/inbox";

import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { isAuthenticated, getActivePage } from "../../../states/core";
import { showModal } from "../../../states/modals";
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
        Bosh sahifa
      </a>
      <a href="/" class={navItemClass("test")} router-link data-nav-item="test">
        <Fa icon="fa-keyboard" class="mr-2" />
        Test
      </a>
      <a
        href="/leaderboards"
        class={navItemClass("leaderboards")}
        router-link
        data-nav-item="leaderboards"
      >
        <Fa icon="fa-crown" class="mr-2" />
        Reyting
      </a>
      <a
        href="/about"
        class={navItemClass("about")}
        router-link
        data-nav-item="about"
      >
        <Fa icon="fa-info-circle" class="mr-2" />
        Loyiha haqida
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
      <button
        type="button"
        onClick={() => {
          showModal("GlobalFeedback");
        }}
        class="ml-2 flex h-9 w-9 items-center justify-center rounded-full text-sub transition-all duration-300 hover:bg-sub-alt hover:text-text"
        aria-label="Fikr bildirish"
        title="Fikr bildirish / Shikoyat"
      >
        <Fa icon="fa-comment-alt" class="transition-all duration-300" />
      </button>

      <button
        type="button"
        onClick={() => {
          const current = getConfig.language;
          const nextLang =
            current === "uzbek"
              ? "english"
              : current === "english"
                ? "russian"
                : "uzbek";
          setConfig("language", nextLang);
        }}
        class="ml-2 flex h-9 items-center justify-center rounded-full px-3 text-xs font-bold text-sub uppercase transition-all duration-300 hover:bg-sub-alt hover:text-text"
        aria-label="Toggle test language"
      >
        {getConfig.language === "uzbek"
          ? "UZ"
          : getConfig.language === "russian"
            ? "RU"
            : "EN"}
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
          class={cn("relative",
            "ml-2 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all hover:scale-105",
            getActivePage() === "account"
              ? "bg-main text-bg"
              : "bg-sub-alt/50 text-text hover:bg-sub-alt",
          )}
          router-link
        >
          <Fa icon="fa-user" />
          Profil
          
        </a>
      </Show>
    </nav>
  );
}





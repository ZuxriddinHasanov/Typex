import { JSXElement, Show, createMemo } from "solid-js";

import { getActivePage, getIsScreenshotting } from "../../../states/core";
import { isTestActive as getIsTestActive } from "../../../states/test";
import { getTheme } from "../../../states/theme";
import { cn } from "../../../utils/cn";
import { isColorDark } from "../../../utils/colors";
import { Fa } from "../../common/Fa";

export function Footer(): JSXElement {
  const isDark = createMemo(() => isColorDark(getTheme().bg));
  const showFooter = () =>
    !getActivePage().startsWith("admin") &&
    getActivePage() !== "login" &&
    getActivePage() !== "onboarding";

  return (
    <Show when={showFooter()}>
      <div
        class={cn(
          "w-full overflow-hidden transition-all duration-500",
          getIsTestActive() || getIsScreenshotting()
            ? "pointer-events-none mt-0 max-h-0 opacity-0"
            : "mt-24 max-h-[1000px] opacity-100",
        )}
      >
        <footer class="border-t border-sub/10 bg-bg/50 px-8 py-16 text-base text-sub backdrop-blur-md">
          <div class="mx-auto flex max-w-7xl flex-col gap-12 transition-opacity">
            <div class="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              <div class="flex flex-col gap-4">
                <a
                  href="/"
                  class="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-text transition-colors hover:text-main"
                  router-link
                >
                  <img
                    src={isDark() ? "/images/logo2.png" : "/images/logo.png"}
                    alt="TypeX Logo"
                    class="h-10 w-auto object-contain"
                  />
                  TypeX.uz
                </a>
                <p class="max-w-xs text-sm leading-relaxed text-sub">
                  O&apos;zbekistonning birinchi raqamli yozuv tezligi testi
                  platformasi. AI tahlil orqali natijalaringizni kuzating va
                  reytingda yuksaling.
                </p>
              </div>

              <div class="flex flex-col gap-4">
                <h4 class="text-sm font-bold tracking-widest text-text uppercase">
                  Platforma
                </h4>
                <div class="flex flex-col gap-3">
                  <a
                    href="/test"
                    router-link
                    class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:translate-x-1 hover:text-main"
                  >
                    <span class="flex h-6 w-6 items-center justify-center rounded-md bg-sub/10 text-[10px] transition-colors group-hover:bg-main/10 group-hover:text-main">
                      <i class="fas fa-keyboard"></i>
                    </span>
                    Yozish testi
                  </a>
                  <a
                    href="/leaderboards"
                    router-link
                    class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:translate-x-1 hover:text-main"
                  >
                    <span class="flex h-6 w-6 items-center justify-center rounded-md bg-sub/10 text-[10px] transition-colors group-hover:bg-main/10 group-hover:text-main">
                      <i class="fas fa-crown"></i>
                    </span>
                    Reytinglar
                  </a>
                  <a
                    href="/about"
                    router-link
                    class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:translate-x-1 hover:text-main"
                  >
                    <span class="flex h-6 w-6 items-center justify-center rounded-md bg-sub/10 text-[10px] transition-colors group-hover:bg-main/10 group-hover:text-main">
                      <i class="fas fa-info"></i>
                    </span>
                    Loyiha haqida
                  </a>
                </div>
              </div>

              <div class="flex flex-col gap-4">
                <h4 class="text-sm font-bold tracking-widest text-text uppercase">
                  Huquqiy
                </h4>
                <div class="flex flex-col gap-3">
                  <a
                    href="/privacy-policy"
                    router-link
                    class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:-translate-y-0.5 hover:text-main"
                  >
                    <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-sub/10 text-[10px] text-sub transition-colors group-hover:bg-main/15 group-hover:text-main">
                      <Fa icon="fa-shield-alt" />
                    </span>
                    Maxfiylik siyosati
                  </a>
                  <a
                    href="/terms-of-service"
                    router-link
                    class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:-translate-y-0.5 hover:text-main"
                  >
                    <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-sub/10 text-[10px] text-sub transition-colors group-hover:bg-main/15 group-hover:text-main">
                      <Fa icon="fa-file-contract" />
                    </span>
                    Foydalanish shartlari
                  </a>
                  <a
                    href="/security-policy"
                    router-link
                    class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:-translate-y-0.5 hover:text-main"
                  >
                    <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-sub/10 text-[10px] text-sub transition-colors group-hover:bg-main/15 group-hover:text-main">
                      <Fa icon="fa-lock" />
                    </span>
                    Xavfsizlik siyosati
                  </a>
                </div>
              </div>

              <div class="flex flex-col gap-4">
                <h4 class="text-sm font-bold tracking-widest text-text uppercase">
                  Ijtimoiy tarmoqlar
                </h4>
                <div class="flex flex-col gap-3">
                  <a
                    href="https://t.me/typex_uz"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:text-main"
                  >
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-sub-alt/50 transition-colors group-hover:bg-[#229ED9]/10 group-hover:text-[#229ED9]">
                      <Fa icon="fa-telegram-plane" variant="brand" />
                    </span>
                    Telegram Kanal
                  </a>

                  <a
                    href="https://www.instagram.com/typexuz/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:text-main"
                  >
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-sub-alt/50 transition-colors group-hover:bg-[#E1306C]/10 group-hover:text-[#E1306C]">
                      <Fa icon="fa-instagram" variant="brand" />
                    </span>
                    Instagram
                  </a>
                </div>
              </div>
            </div>

            <div class="flex flex-col items-center justify-between gap-4 border-t border-sub/10 pt-8 sm:flex-row">
              <p class="text-sm font-medium text-sub">
                &copy; {new Date().getFullYear()} TypeX.uz. Barcha huquqlar
                himoyalangan.
              </p>
              <div class="flex items-center gap-4 text-sm text-sub">
                <span>
                  Made with <span class="text-red-500">❤️</span> in Uzbekistan
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Show>
  );
}

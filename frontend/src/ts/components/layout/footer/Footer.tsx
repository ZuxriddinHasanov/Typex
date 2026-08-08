import { JSXElement, Show } from "solid-js";

import { getActivePage, getIsScreenshotting } from "../../../states/core";
import { isTestActive as getIsTestActive } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { Fa } from "../../common/Fa";

export function Footer(): JSXElement {
  const showFooter = () =>
    getActivePage() !== "adminLogin" &&
    getActivePage() !== "adminDashboard" &&
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
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-main text-bg">
                    <span class="text-sm">TX</span>
                  </div>
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
                    href="https://t.me/root_v7be"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:text-main"
                  >
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-sub-alt/50 transition-colors group-hover:bg-main/10">
                      <svg
                        class="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.127.087.496.122.629.156.61.443 2.165.556 3.303.11 1.194.057 2.235-.444 2.663a1.266 1.266 0 01-.49.243c-.477.116-1.11-.152-1.724-.476-.484-.256-1.801-1.184-2.39-1.445-.174-.078-.25-.223-.006-.397.423-.356 1.025-.985 1.39-1.322.423-.39.125-.594-.222-.39l-1.755 1.12c-.643.402-1.426.584-1.859.4-.43-.182-.914-.436-1.34-.663-.519-.312-.968-.627-.919-1.026.03-.233.3-.472.844-.717.878-.396 1.992-.79 3.042-1.19 1.183-.452 2.484-.858 3.486-1.14 1.915-.538 2.328-.6 2.615-.598zm.002.001z"></path>
                      </svg>
                    </span>
                    Telegram
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

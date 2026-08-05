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
          "w-full transition-all duration-500 overflow-hidden",
          getIsTestActive() || getIsScreenshotting() ? "opacity-0 max-h-0 pointer-events-none mt-0" : "opacity-100 max-h-[1000px] mt-24"
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
                  <span class="text-sm">T</span>
                </div>
                TypeUZ
              </a>
              <p class="max-w-xs text-sm leading-relaxed text-sub">
                O&apos;zbekistonning birinchi raqamli yozuv tezligi testi platformasi.
                AI tahlil orqali natijalaringizni kuzating va reytingda yuksaling.
              </p>
            </div>

            <div class="flex flex-col gap-4">
              <h4 class="text-sm font-bold tracking-widest text-text uppercase">
                Platforma
              </h4>
              <div class="flex flex-col gap-3">
                <a href="/test" router-link class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:text-main hover:translate-x-1">
                  <span class="flex h-6 w-6 items-center justify-center rounded-md bg-sub/10 text-[10px] transition-colors group-hover:bg-main/10 group-hover:text-main"><i class="fas fa-keyboard"></i></span>
                  Yozish testi
                </a>
                <a href="/leaderboards" router-link class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:text-main hover:translate-x-1">
                  <span class="flex h-6 w-6 items-center justify-center rounded-md bg-sub/10 text-[10px] transition-colors group-hover:bg-main/10 group-hover:text-main"><i class="fas fa-crown"></i></span>
                  Reytinglar
                </a>
                <a href="/about" router-link class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:text-main hover:translate-x-1">
                  <span class="flex h-6 w-6 items-center justify-center rounded-md bg-sub/10 text-[10px] transition-colors group-hover:bg-main/10 group-hover:text-main"><i class="fas fa-info"></i></span>
                  Loyiha haqida
                </a>
              </div>
            </div>

            <div class="flex flex-col gap-4">
              <h4 class="text-sm font-bold tracking-widest text-text uppercase">
                Huquqiy
              </h4>
              <div class="flex flex-col gap-3">
                <a href="/privacy-policy" router-link class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:text-main hover:-translate-y-0.5">
                  <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-sub/10 text-[10px] text-sub transition-colors group-hover:bg-main/15 group-hover:text-main"><Fa icon="fa-shield-alt" /></span>
                  Maxfiylik siyosati
                </a>
                <a href="/terms-of-service" router-link class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:text-main hover:-translate-y-0.5">
                  <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-sub/10 text-[10px] text-sub transition-colors group-hover:bg-main/15 group-hover:text-main"><Fa icon="fa-file-contract" /></span>
                  Foydalanish shartlari
                </a>
                <a href="/security-policy" router-link class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:text-main hover:-translate-y-0.5">
                  <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-sub/10 text-[10px] text-sub transition-colors group-hover:bg-main/15 group-hover:text-main"><Fa icon="fa-lock" /></span>
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
                  href="https://t.me/typeuz"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:text-main"
                >
                  <span class="flex h-8 w-8 items-center justify-center rounded-full bg-sub-alt/50 transition-colors group-hover:bg-main/10">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.127.087.496.122.629.156.61.443 2.165.556 3.303.11 1.194.057 2.235-.444 2.663a1.266 1.266 0 01-.49.243c-.477.116-1.11-.152-1.724-.476-.484-.256-1.801-1.184-2.39-1.445-.174-.078-.25-.223-.006-.397.423-.356 1.025-.985 1.39-1.322.423-.39.125-.594-.222-.39l-1.755 1.12c-.643.402-1.426.584-1.859.4-.43-.182-.914-.436-1.34-.663-.519-.312-.968-.627-.919-1.026.03-.233.3-.472.844-.717.878-.396 1.992-.79 3.042-1.19 1.183-.452 2.484-.858 3.486-1.14 1.915-.538 2.328-.6 2.615-.598zm.002.001z"></path>
                    </svg>
                  </span>
                  Telegram
                </a>
                <a
                  href="https://instagram.com/typeuz"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group flex w-fit items-center gap-2 text-sm font-medium text-sub transition-all hover:text-main"
                >
                  <span class="flex h-8 w-8 items-center justify-center rounded-full bg-sub-alt/50 transition-colors group-hover:bg-main/10">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                    </svg>
                  </span>
                  Instagram
                </a>
              </div>
            </div>
          </div>

          <div class="flex flex-col items-center justify-between gap-4 border-t border-sub/10 pt-8 sm:flex-row">
            <p class="text-sm font-medium text-sub">&copy; {new Date().getFullYear()} TypeUZ.uz. Barcha huquqlar himoyalangan.</p>
            <div class="flex items-center gap-4 text-sm text-sub">
              <span>Made with <span class="text-red-500">❤️</span> in Uzbekistan</span>
            </div>
          </div>
          </div>
        </footer>
      </div>
    </Show>
  );
}

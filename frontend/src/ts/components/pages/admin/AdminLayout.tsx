// oxlint-disable typescript/no-explicit-any, typescript/no-unsafe-assignment, typescript/no-unsafe-member-access, typescript/no-unsafe-call
import { JSXElement, Show, For } from "solid-js";

import { signOut } from "../../../auth";
import { cn } from "../../../utils/cn";
import { Fa } from "../../common/Fa";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "fa-chart-pie",
    href: "/typeuz-hq/dashboard",
  },
  {
    id: "users",
    label: "Foydalanuvchilar",
    icon: "fa-users",
    href: "/typeuz-hq/users",
  },
  {
    id: "content",
    label: "Kontent",
    icon: "fa-pencil-alt",
    href: "/typeuz-hq/content",
  },
  {
    id: "analytics",
    label: "Analitika",
    icon: "fa-chart-bar",
    href: "/typeuz-hq/analytics",
  },
  { id: "ai", label: "AI tahlil", icon: "fa-brain", href: "/typeuz-hq/ai" },
  {
    id: "notifications",
    label: "Bildirishnomalar",
    icon: "fa-bell",
    href: "/typeuz-hq/notifications",
  },
  { id: "ads", label: "Reklama", icon: "fa-ad", href: "/typeuz-hq/ads" },
  {
    id: "settings",
    label: "Sozlamalar",
    icon: "fa-cog",
    href: "/typeuz-hq/settings",
  },
];

export function AdminLayout(props: {
  active: string;
  title: string;
  children: JSXElement;
}): JSXElement {
  return (
    <div class="fixed inset-0 z-[100] flex bg-bg font-sans">
      {/* Sidebar */}
      <aside class="bg-bg-alt/80 relative z-20 flex w-72 flex-col border-r border-sub/10 shadow-2xl backdrop-blur-xl">
        <div class="flex items-center gap-4 border-b border-sub/10 px-8 py-8">
          <div class="grid h-12 w-12 place-items-center rounded-xl bg-main">
            <Fa icon="fa-shield-alt" class="text-xl text-bg" />
          </div>
          <div>
            <div class="text-base font-bold text-text">TypeUZ Admin</div>
            <div class="text-xs text-sub">Boshqaruv paneli</div>
          </div>
        </div>
        <nav class="flex flex-1 flex-col gap-2 p-6">
          <For each={navItems}>
            {(item) => (
              <a
                href={item.href}
                router-link
                class={cn(
                  "flex items-center gap-4 rounded-2xl px-6 py-4 text-sm font-semibold transition-all duration-300",
                  props.active === item.id
                    ? "translate-x-1 bg-gradient-to-r from-main to-main/80 text-bg shadow-lg shadow-main/30"
                    : "text-sub hover:translate-x-1 hover:bg-sub-alt/50 hover:text-text",
                )}
              >
                <Fa icon={item.icon as any} class="w-5 text-sm" />
                {item.label}
              </a>
            )}
          </For>
        </nav>
        <div class="border-t border-sub/10 p-6">
          <button
            type="button"
            onClick={() => {
              signOut();
              window.location.href = "/";
            }}
            class="flex w-full items-center justify-center gap-3 rounded-2xl bg-error/10 px-4 py-4 text-sm font-bold text-error transition-all hover:bg-error hover:text-bg"
          >
            <Fa icon="fa-sign-out-alt" class="text-sm" />
            Chiqish
          </button>
        </div>
      </aside>

      {/* Main */}
      <div class="relative flex flex-1 flex-col overflow-hidden">
        {/* Decorative background blur */}
        <div class="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-main/5 blur-[120px]"></div>

        {/* Topbar */}
        <header class="relative z-10 flex h-24 items-center justify-between border-b border-sub/5 bg-bg/40 px-12 backdrop-blur-md">
          <div class="flex items-center gap-6">
            <h1 class="text-3xl font-black tracking-tight text-text">
              {props.title}
            </h1>
            <div class="animate-pulse rounded-full bg-main/10 px-4 py-1.5 text-xs font-bold tracking-widest text-main uppercase ring-1 ring-main/20">
              Root Access
            </div>
          </div>
          <div class="flex items-center gap-4">
            <a
              href="/"
              router-link
              class="flex items-center rounded-2xl bg-sub-alt px-5 py-3 text-sm font-bold text-sub transition-all hover:bg-main/10 hover:text-main"
            >
              <Fa icon="fa-arrow-left" class="mr-2" />
              Saytga qaytish
            </a>
          </div>
        </header>

        {/* Content */}
        <main class="flex-1 overflow-y-auto">
          <div class="mx-auto w-full max-w-7xl p-8 lg:p-12">
            <Show
              when={props.children}
              fallback={
                <div class="flex h-64 items-center justify-center text-lg text-sub">
                  Yuklanmoqda...
                </div>
              }
            >
              {props.children}
            </Show>
          </div>
        </main>
      </div>
    </div>
  );
}

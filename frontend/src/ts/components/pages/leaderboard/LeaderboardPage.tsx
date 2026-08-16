// oxlint-disable react/no-unescaped-entities, typescript/no-explicit-any, solid/prefer-show, typescript/strict-boolean-expressions, curly, dot-notation, no-unnecessary-type-assertion, typescript/no-unsafe-assignment, typescript/no-unsafe-member-access, typescript/no-unsafe-call, typescript/no-unsafe-return, typescript/no-unsafe-argument, react/button-has-type
import type { Language } from "@typeuz/schemas/languages";

import { useQuery } from "@tanstack/solid-query";
import { For, JSXElement, Show, createSignal, createEffect } from "solid-js";

import {
  getLeaderboardQueryOptions,
  getRankQueryOptions,
} from "../../../queries/leaderboards";
import { getActivePage, getUserId, isAuthenticated } from "../../../states/core";
import {
  getPage,
  getSelection,
  setPage,
  setSelection,
  updateGetParameters,
} from "../../../states/leaderboard-selection";
import { cn } from "../../../utils/cn";
import AsyncContent from "../../common/AsyncContent";
import { Page } from "../../common/Page";
import { TypeUZAdSlot } from "../../common/TypeUZAdSlot";
import { User } from "../../common/User";

const pageName = "leaderboards";

const durationOptions = ["10", "15", "30", "60", "120"] as const;
const wordCountOptions = ["10", "25", "50", "100"] as const;

const languages = [
  { id: "uzbek", label: "O'zbekcha", flag: "🇺🇿" },
  { id: "english", label: "English", flag: "🇬🇧" },
  { id: "russian", label: "Русский", flag: "🇷🇺" },
] as const;

type LbTab = "time" | "words" | "weekly";

const LbTABS: { id: LbTab; label: string; icon: string }[] = [
  { id: "time", label: "Vaqt bo'yicha", icon: "fa-stopwatch" },
  { id: "words", label: "So'zlar bo'yicha", icon: "fa-font" },
  { id: "weekly", label: "Tajriba (XP)", icon: "fa-star" },
];

export function LeaderboardPage(): JSXElement {
  const [activeTab, setActiveTab] = createSignal<LbTab>("time");

  const isOpen = () => getActivePage() === pageName;

  const selection = () => getSelection();
  const page = () => getPage();

  const effectiveSelection = () => {
    const s = selection();
    if (activeTab() === "weekly") {
      return {
        type: "weekly" as const,
        friendsOnly: (s as { friendsOnly?: boolean }).friendsOnly ?? false,
        previous: (s as { previous?: boolean }).previous ?? false,
      };
    }
    if (activeTab() === "words") {
      const mode2Val = (s as { mode2?: string }).mode2;
      const validMode2 =
        mode2Val !== undefined &&
        wordCountOptions.includes(mode2Val as (typeof wordCountOptions)[number])
          ? mode2Val
          : "10";
      return {
        ...s,
        type: "allTime" as const,
        mode: "words" as const,
        mode2: validMode2,
        language: (s as { language?: Language }).language ?? "uzbek",
        numbers: false,
      };
    }
    const mode2Val = (s as { mode2?: string }).mode2;
    const validMode2 =
      mode2Val !== undefined &&
      durationOptions.includes(mode2Val as (typeof durationOptions)[number])
        ? mode2Val
        : "15";
    return {
      ...s,
      type: "allTime" as const,
      mode: "time" as const,
      mode2: validMode2,
      language: (s as { language?: Language }).language ?? "uzbek",
      numbers: false,
    };
  };

  const sel = () => effectiveSelection();

  const lbQuery = useQuery(() => ({
    ...getLeaderboardQueryOptions({
      ...effectiveSelection(),
      page: page(),
    }),
    enabled: isOpen(),
  }));

  const rankQuery = useQuery(() => ({
    ...getRankQueryOptions(effectiveSelection()),
    enabled: isOpen() && isAuthenticated(),
  }));

  const goToPage = (dir: -1 | 1) => {
    const next = page() + dir;
    if (next < 0) return;
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  createEffect(() => {
    updateGetParameters(sel(), page());
  });

  return (
    <Page id={pageName}>
      <div class="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
        <div class="flex flex-col gap-4">
          <h1 class="text-2xl font-bold text-text">Reyting</h1>

          <div class="flex flex-wrap items-center gap-2">
            <For each={LbTABS}>
              {(tab) => (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPage(0);
                    if (tab.id === "time") {
                      setSelection({
                        ...sel(),
                        mode: "time",
                        mode2: "15",
                      } as never);
                    } else if (tab.id === "words") {
                      setSelection({
                        ...sel(),
                        mode: "words",
                        mode2: "10",
                      } as never);
                    }
                  }}
                  class={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                    activeTab() === tab.id
                      ? "bg-main text-bg"
                      : "bg-sub-alt text-text hover:bg-sub",
                  )}
                >
                  <i class={cn("fas", tab.icon)}></i>
                  {tab.label}
                </button>
              )}
            </For>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Show when={activeTab() === "time"}>
              <div class="flex flex-wrap items-center gap-2">
                <For each={durationOptions}>
                  {(d) => (
                    <button
                      type="button"
                      onClick={() => {
                        setSelection({
                          ...sel(),
                          mode: "time",
                          mode2: d,
                        } as never);
                        setPage(0);
                      }}
                      class={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                        sel().mode2 === d
                          ? "bg-main text-bg"
                          : "bg-sub-alt text-sub hover:text-text",
                      )}
                    >
                      {d}s
                    </button>
                  )}
                </For>
              </div>
            </Show>

            <Show when={activeTab() === "words"}>
              <div class="flex flex-wrap items-center gap-2">
                <For each={wordCountOptions}>
                  {(w) => (
                    <button
                      type="button"
                      onClick={() => {
                        setSelection({
                          ...sel(),
                          mode: "words",
                          mode2: w,
                        } as never);
                        setPage(0);
                      }}
                      class={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                        sel().mode2 === w
                          ? "bg-main text-bg"
                          : "bg-sub-alt text-sub hover:text-text",
                      )}
                    >
                      {w} so&apos;z
                    </button>
                  )}
                </For>
              </div>
            </Show>
            <Show when={activeTab() !== "weekly"}>
              <div class="flex flex-wrap items-center gap-1.5 border-l border-sub/10 pl-2 sm:ml-2">
                <For each={languages}>
                  {(lang) => (
                    <button
                      type="button"
                      onClick={() => {
                        setSelection({
                          ...sel(),
                          language: lang.id as Language,
                        } as never);
                        setPage(0);
                      }}
                      class={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                        (sel() as any).language === lang.id
                          ? "bg-main text-bg"
                          : "bg-sub-alt text-sub hover:text-text",
                      )}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>

        <Show when={rankQuery.data}>
          {(data) => {
            const d = data();
            return (
              <div class="rounded-2xl bg-main/10 px-5 py-3 text-sm">
                <span class="text-sub">Sizning o&apos;rningiz: </span>
                <span class="font-bold text-text">
                  {d.rank}-o&apos;rin (
                  {"wpm" in d
                    ? `${d.wpm} WPM`
                    : "totalXp" in d
                      ? `${d.totalXp} XP`
                      : "—"}
                  )
                </span>
              </div>
            );
          }}
        </Show>

        <TypeUZAdSlot slotId="ad-leaderboard" class="w-full" />

        <AsyncContent queries={{ lbQuery }} errorMessage="Reyting yuklanmadi">
          {({ lbQueryData }) => {
            const entries = () => lbQueryData()?.entries ?? [];
            const podium = () => (page() === 0 ? entries().slice(0, 3) : []);
            const rest = () => (page() === 0 ? entries().slice(3) : entries());

            return (
              <>
                <Show when={entries().length === 0}>
                  <div class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-sub-alt/40 bg-sub-alt/20 py-16 text-center">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-main/10 text-3xl text-main">
                      <i class="fas fa-trophy"></i>
                    </div>
                    <div class="flex flex-col gap-1">
                      <p class="text-lg font-bold text-text">
                        Hozircha natijalar yo&apos;q
                      </p>
                      <p class="max-w-md text-sm text-sub">
                        Ushbu bo&apos;limda birinchi bo&apos;lib test topshirib,
                        reytingda 1-o&apos;rinni egallang!
                      </p>
                    </div>
                    <a
                      href="/test"
                      class="mt-2 flex items-center gap-2 rounded-xl bg-main px-6 py-2.5 text-sm font-bold text-bg transition-transform hover:scale-105"
                    >
                      <i class="fas fa-keyboard"></i>
                      Test topshirish
                    </a>
                  </div>
                </Show>

                <Show when={podium().length > 0}>
                  <div class="mt-8 mb-12 flex flex-row items-end justify-center gap-4 px-4 sm:gap-8">
                    <For each={[1, 0, 2]}>
                      {(pos) => {
                        const entry = () => podium()[pos];
                        return (
                          <Show when={entry()}>
                            <div
                              class="animate-in fade-in slide-in-from-bottom-8 fill-mode-both flex flex-col items-center justify-end gap-3 duration-500"
                              style={{
                                "animation-delay": `${pos === 0 ? 0 : pos === 1 ? 150 : 300}ms`,
                              }}
                            >
                              <User
                                user={
                                  entry() as unknown as Parameters<
                                    typeof User
                                  >[0]["user"]
                                }
                                avatarFallback="user-circle"
                                avatarColor="sub"
                                flagsColor="sub"
                                class="text-xl sm:text-2xl"
                                linkToProfile={true}
                                showAvatar={true}
                              />
                              <div
                                class={cn(
                                  "flex w-24 flex-col items-center justify-center rounded-t-2xl sm:w-32",
                                  pos === 0
                                    ? "h-32 border-x border-t border-main/30 bg-main/20 text-main"
                                    : pos === 1
                                      ? "h-24 bg-sub-alt text-text"
                                      : "h-20 bg-sub-alt/60 text-sub",
                                )}
                              >
                                <span class="text-2xl font-black sm:text-3xl">
                                  {pos === 0 ? "🥇" : pos === 1 ? "🥈" : "🥉"}
                                </span>
                                <span class="mt-2 text-sm font-bold sm:text-base">
                                  {"totalXp" in (entry() as object)
                                    ? `${(entry() as { totalXp: number }).totalXp} XP`
                                    : `${(entry() as { wpm: number }).wpm} WPM`}
                                </span>
                              </div>
                            </div>
                          </Show>
                        );
                      }}
                    </For>
                  </div>
                </Show>

                <div class="flex flex-col gap-2">
                  <For each={rest()}>
                    {(entry, i) => {
                      const e = entry as {
                        name: string;
                        uid: string;
                        wpm?: number;
                        totalXp?: number;
                        acc?: number;
                      };
                      const isMe = () => e.uid === getUserId();
                      const idx = () =>
                        "rank" in e
                          ? (e as unknown as { rank: number }).rank
                          : page() === 0
                            ? i() + 3 + 1
                            : page() * 50 + i() + 1;
                      return (
                        <div
                          class={cn(
                            "animate-in fade-in slide-in-from-bottom-4 fill-mode-both flex items-center gap-4 rounded-2xl px-5 py-3 transition-all duration-300",
                            isMe()
                              ? "border-2 border-main bg-main/15 shadow-md shadow-main/10"
                              : "bg-sub-alt/40 hover:bg-sub-alt",
                          )}
                          style={{ "animation-delay": `${(i() % 10) * 50}ms` }}
                        >
                          <span
                            class={cn(
                              "w-8 text-center text-lg font-bold",
                              isMe() ? "text-main font-black" : "text-sub",
                            )}
                          >
                            #{idx()}
                          </span>
                          <div class="flex flex-1 items-center gap-3">
                            <User
                              user={e}
                              avatarFallback="user-circle"
                              avatarColor={isMe() ? "main" : "sub"}
                              flagsColor="sub"
                              class="text-base"
                              linkToProfile={true}
                            />
                            <Show when={isMe()}>
                              <span class="rounded-md bg-main/20 px-2 py-0.5 text-[10px] font-black text-main uppercase">
                                Siz
                              </span>
                            </Show>
                            <Show when={e.acc}>
                              <span class="text-xs text-sub/60">
                                {e.acc}% aniqlik
                              </span>
                            </Show>
                          </div>
                          <span
                            class={cn(
                              "text-sm font-semibold",
                              isMe() ? "text-main font-black" : "text-text",
                            )}
                          >
                            {"totalXp" in entry
                              ? `${(entry as { totalXp: number }).totalXp} XP`
                              : `${(entry as { wpm: number }).wpm} WPM`}
                          </span>
                        </div>
                      );
                    }}
                  </For>
                </div>

                {/* Current user fixed card at bottom if not in current page list */}
                <Show
                  when={
                    isAuthenticated() &&
                    rankQuery.data &&
                    !entries().some((e: any) => e.uid === getUserId())
                  }
                >
                  <div class="mt-6 flex items-center gap-4 rounded-2xl border-2 border-main/50 bg-main/10 px-6 py-4 shadow-xl backdrop-blur-md">
                    <div class="flex items-center gap-2">
                      <span class="rounded-lg bg-main px-2.5 py-1 text-xs font-black text-bg uppercase">
                        Siz
                      </span>
                      <span class="text-xl font-black text-main">
                        #{rankQuery.data?.rank}
                      </span>
                    </div>
                    <div class="flex flex-1 items-center gap-3">
                      <span class="font-bold text-text">Sizning o'rningiz</span>
                      <span class="text-xs text-sub/70">
                        (Top {page() === 0 ? "50" : (page() + 1) * 50} dan tashqarida)
                      </span>
                    </div>
                    <span class="text-base font-black text-main">
                      {rankQuery.data && typeof rankQuery.data === "object"
                        ? "wpm" in rankQuery.data
                          ? `${(rankQuery.data as any).wpm} WPM`
                          : "totalXp" in rankQuery.data
                            ? `${(rankQuery.data as any).totalXp} XP`
                            : "—"
                        : "—"}
                    </span>
                  </div>
                </Show>
              </>
            );
          }}
        </AsyncContent>

        <div class="flex items-center justify-center gap-4">
          <button
            onClick={() => goToPage(-1)}
            type="button"
            disabled={page() === 0 || lbQuery.isFetching}
            class="rounded-xl bg-sub-alt px-4 py-2 text-sm text-text transition-colors hover:bg-sub disabled:opacity-30"
          >
            Oldingi
          </button>
          <span class="text-sm text-sub">{page() + 1}-sahifa</span>
          <button
            type="button"
            onClick={() => goToPage(1)}
            disabled={
              (lbQuery.data?.entries?.length ?? 0) < 50 || lbQuery.isFetching
            }
            class="rounded-xl bg-sub-alt px-4 py-2 text-sm text-text transition-colors hover:bg-sub disabled:opacity-30"
          >
            Keyingi
          </button>
        </div>
      </div>
    </Page>
  );
}

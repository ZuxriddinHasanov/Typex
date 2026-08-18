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
import { User } from "../../common/User";
import { DiscordAvatar } from "../../common/DiscordAvatar";
import { getLevelFromTotalXp } from "../../../utils/levels";

const pageName = "leaderboards";

function getUserLevel(entry: unknown): number {
  if (!entry || typeof entry !== "object") return 1;
  const e = entry as Record<string, unknown>;
  if (typeof e["level"] === "number") return Math.max(1, e["level"]);
  if (typeof e["totalXp"] === "number") return Math.max(1, getLevelFromTotalXp(e["totalXp"]));
  if (typeof e["xp"] === "number") return Math.max(1, getLevelFromTotalXp(e["xp"]));
  if (typeof e["wpm"] === "number") return Math.max(1, Math.floor(e["wpm"] / 15) + 1);
  return 1;
}

const durationOptions = ["10", "15", "30", "60", "120"] as const;
const wordCountOptions = ["10", "25", "50", "100"] as const;

const _languages = [
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

type PeriodTab = "daily" | "weekly" | "monthly" | "allTime";
const PERIODS: { id: PeriodTab; label: string }[] = [
  { id: "daily", label: "Kunlik" },
  { id: "weekly", label: "Haftalik" },
  { id: "monthly", label: "Oylik" },
  { id: "allTime", label: "Umumiy" },
];

export function LeaderboardPage(): JSXElement {
  const [activeTab, setActiveTab] = createSignal<LbTab>("time");
  const [activePeriod, setActivePeriod] = createSignal<PeriodTab>("allTime");

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
    
    // For words/time, use activePeriod (if it's not supported by API it falls back to allTime internally or throws error, we assume ts-rest handles it or backend has fallback)
    const typeVal = activePeriod() as "allTime" | "daily" | "weekly" | "monthly";

    if (activeTab() === "words") {
      const mode2Val = (s as { mode2?: string }).mode2;
      const validMode2 =
        mode2Val !== undefined &&
        wordCountOptions.includes(mode2Val as (typeof wordCountOptions)[number])
          ? mode2Val
          : "10";
      return {
        ...s,
        type: typeVal,
        mode: "words" as const,
        mode2: validMode2,
        language: (s as { language?: Language }).language ?? "uzbek",
        numbers: undefined,
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
      type: typeVal,
      mode: "time" as const,
      mode2: validMode2,
      language: (s as { language?: Language }).language ?? "uzbek",
      numbers: undefined,
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
        <div class="flex flex-col gap-6 relative z-10">
          <div class="flex flex-col gap-1">
            <h1 class="text-4xl sm:text-5xl font-black text-text tracking-tighter">Reytinglar</h1>
            <p class="text-sub font-medium">Typex ning eng tezkor va tajribali qahramonlari bilan tanishing.</p>
          </div>

          <div class="flex flex-col xl:flex-row xl:items-center gap-4">
            <div class="flex flex-wrap items-center gap-2 rounded-2xl bg-sub-alt/30 p-1.5 shadow-inner backdrop-blur-sm self-start">
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
                      "flex flex-1 sm:flex-none justify-center items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300",
                      activeTab() === tab.id
                        ? "bg-main text-bg shadow-md scale-[1.02]"
                        : "text-sub hover:text-text hover:bg-sub-alt/50",
                    )}
                  >
                    <i class={cn("fas", tab.icon)}></i>
                    {tab.label}
                  </button>
                )}
              </For>
            </div>

            {/* Period Tabs */}
            <Show when={activeTab() !== "weekly"}>
              <div class="flex flex-wrap items-center gap-2 rounded-2xl bg-sub-alt/30 p-1.5 shadow-inner backdrop-blur-sm self-start">
              <For each={PERIODS}>
                {(period) => (
                  <button
                    type="button"
                    onClick={() => {
                      setActivePeriod(period.id);
                      setPage(0);
                    }}
                    class={cn(
                      "flex flex-1 sm:flex-none justify-center items-center gap-2.5 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300",
                      activePeriod() === period.id
                        ? "bg-text text-bg shadow-md scale-[1.02]"
                        : "text-sub hover:text-text hover:bg-sub-alt/50",
                    )}
                  >
                    {period.label}
                  </button>
                )}
              </For>
              </div>
            </Show>

            <div class="flex flex-wrap items-center gap-2">
              <Show when={activeTab() === "time"}>
                <div class="flex flex-wrap items-center gap-1 sm:gap-2 rounded-2xl bg-sub-alt/10 p-1.5 shadow-sm">
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
                          "rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition-all",
                          (sel() as Record<string, unknown>)["mode2"] === d
                            ? "bg-text text-bg shadow-sm scale-105"
                            : "text-sub hover:text-text hover:bg-sub-alt/50",
                        )}
                      >
                        {d}s
                      </button>
                    )}
                  </For>
                </div>
              </Show>

              <Show when={activeTab() === "words"}>
                <div class="flex flex-wrap items-center gap-1 sm:gap-2 rounded-2xl bg-sub-alt/10 p-1.5 shadow-sm">
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
                          "rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition-all",
                          (sel() as Record<string, unknown>)["mode2"] === w
                            ? "bg-text text-bg shadow-sm scale-105"
                            : "text-sub hover:text-text hover:bg-sub-alt/50",
                        )}
                      >
                        {w} ta
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        </div>

        <Show when={rankQuery.data}>
          {(data) => (
            <Show when={data() && "rank" in (data() as object)}>
              <div class="rounded-2xl bg-main/10 px-5 py-3 text-sm">
                <span class="text-sub">Sizning o&apos;rningiz: </span>
                <span class="font-bold text-text">
                  {(data() as unknown as { rank: number }).rank}-o&apos;rin (
                  {"wpm" in (data() as object)
                    ? `${(data() as unknown as { wpm: number }).wpm} WPM`
                    : "totalXp" in (data() as object)
                      ? `${(data() as unknown as { totalXp: number }).totalXp} XP`
                      : "—"}
                  )
                </span>
              </div>
            </Show>
          )}
        </Show>

        <AsyncContent queries={{ lbQuery }} errorMessage="Reyting yuklanmadi">
          {({ lbQueryData }) => {
            const entries = () => lbQueryData()?.entries ?? [];
            const podium = () => (page() === 0 ? entries().slice(0, 3) : []);
            const rest = () => (page() === 0 ? entries().slice(3) : entries());

            return (
              <>
                <Show when={entries().length === 0}>
                  <div class="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-sub/30 bg-sub-alt/10 p-12 text-center">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-main/10 text-3xl text-main">
                      <i class="fas fa-ghost"></i>
                    </div>
                    <div class="flex flex-col gap-1">
                      <p class="text-lg font-bold text-text">Bu bo&apos;limda hali natijalar yo&apos;q</p>
                      <p class="max-w-md text-sm text-sub">
                        Birinchi bo&apos;lib natija qayd eting va yetakchiga aylaning!
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
                  <div class="mt-6 mb-10 flex flex-col items-center justify-center rounded-3xl bg-sub-alt/10 p-5 sm:p-8 w-full max-w-4xl mx-auto">
                    {/* Header Pill */}
                    <div class="mb-8 inline-flex items-center gap-2 rounded-full border-2 border-sub/30 bg-bg px-6 py-2 text-xs font-bold text-text shadow-sm backdrop-blur-md uppercase tracking-wider">
                      <i class="fas fa-trophy text-main"></i>
                      <span>
                        {activeTab() === "weekly"
                          ? "Haftalik tajriba peshqadamlari"
                          : activeTab() === "words"
                            ? "So'zlar bo'yicha peshqadamlar"
                            : "Vaqt bo'yicha peshqadamlar"}
                      </span>
                    </div>

                    {/* Top 3 Podium Columns */}
                    <div class="flex flex-row items-end justify-center gap-3 sm:gap-6 w-full max-w-3xl px-1">
                      <For each={[1, 0, 2]}>
                        {(pos) => {
                          const entry = () =>
                            podium()[pos] as
                              | {
                                  uid?: string;
                                  name?: string;
                                  avatar?: string | null;
                                  discordId?: string;
                                  discordAvatar?: string;
                                  wpm?: number;
                                  totalXp?: number;
                                }
                              | undefined;
                          const rankEmoji = () => (pos === 0 ? "🥇" : pos === 1 ? "🥈" : "🥉");
                          const rankTitle = () => (pos === 0 ? "1-o'rin" : pos === 1 ? "2-o'rin" : "3-o'rin");
                          const hasImage = () => !!(entry()?.avatar ?? entry()?.discordAvatar);
                          return (
                            <Show when={entry()}>
                              <a
                                href={entry()?.name ? `/profile/${entry()?.name}` : entry()?.uid ? `/profile/${entry()?.uid}` : "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                class={cn(
                                  "flex flex-col items-center justify-between rounded-3xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer group",
                                  pos === 0
                                    ? "flex-[1.2] min-h-[22rem] sm:min-h-[26rem] border-main bg-gradient-to-b from-main/15 via-main/5 to-bg p-4 sm:p-5 shadow-lg -mt-5 z-10"
                                    : pos === 1
                                      ? "flex-1 min-h-[18rem] sm:min-h-[20rem] border-sub bg-gradient-to-b from-sub/30 via-sub/10 to-bg p-3 sm:p-4 shadow-sm"
                                      : "flex-1 min-h-[16rem] sm:min-h-[18rem] border-amber-600 bg-gradient-to-b from-amber-700/30 via-amber-600/10 to-bg p-3 sm:p-4 shadow-sm"
                                )}
                              >
                                {/* Top Avatar & Identity */}
                                <div class="flex flex-col items-center w-full relative pt-4">
                                  {/* Avatar Container */}
                                  <div class="relative flex items-center justify-center mb-3">
                                    {/* Crown for #1 */}
                                    <Show when={pos === 0}>
                                      <div class="absolute -top-10 sm:-top-12 text-3xl sm:text-5xl text-main animate-bounce z-50 filter drop-shadow-md">
                                        <i class="fas fa-crown"></i>
                                      </div>
                                    </Show>

                                    <div
                                      class={cn(
                                        "relative flex items-center justify-center rounded-full p-0.5 shadow-sm overflow-hidden transition-transform group-hover:scale-105",
                                        pos === 0
                                          ? hasImage()
                                            ? "h-40 w-40 sm:h-52 sm:w-52 ring-4 ring-main bg-bg z-10"
                                            : "h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-main bg-bg z-10"
                                          : pos === 1
                                            ? hasImage()
                                              ? "h-32 w-32 sm:h-44 sm:w-44 ring-4 ring-sub bg-bg"
                                              : "h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-sub bg-bg"
                                            : hasImage()
                                              ? "h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-amber-600 bg-bg"
                                              : "h-20 w-20 sm:h-28 sm:w-28 ring-4 ring-amber-600 bg-bg"
                                      )}
                                    >
                                      <Show
                                        when={entry()?.avatar ?? entry()?.discordAvatar}
                                        fallback={
                                          <div class="flex h-full w-full items-center justify-center bg-sub-alt text-text font-bold text-2xl sm:text-4xl uppercase select-none">
                                            {(entry()?.name ?? "U")[0]}
                                          </div>
                                        }
                                      >
                                        <DiscordAvatar
                                          discordId={entry()?.discordId}
                                          discordAvatar={entry()?.discordAvatar}
                                          avatar={entry()?.avatar}
                                          size={256}
                                          class={cn(
                                            "h-full w-full rounded-full object-cover",
                                            pos === 0 ? "text-[4.5rem] sm:text-[6rem]" :
                                            pos === 1 ? "text-[3.5rem] sm:text-[5rem]" :
                                            "text-[2.5rem] sm:text-[3.5rem]"
                                          )}
                                        />
                                      </Show>
                                    </div>
                                  </div>

                                  {/* User Name */}
                                  <span
                                    class={cn(
                                      "font-black text-text truncate max-w-full text-center mt-2 px-1 transition-colors group-hover:text-main",
                                      pos === 0
                                        ? "text-lg sm:text-xl"
                                        : pos === 1
                                          ? "text-base sm:text-lg"
                                          : "text-sm sm:text-base"
                                    )}
                                  >
                                    {entry()?.name ?? "Foydalanuvchi"}
                                  </span>

                                  {/* Score / WPM Display */}
                                  <div class="mt-3 flex flex-col items-center">
                                    <span
                                      class={cn(
                                        "font-black tracking-tighter drop-shadow-sm",
                                        pos === 0
                                          ? "text-4xl text-main"
                                          : pos === 1
                                            ? "text-3xl text-text"
                                            : "text-2xl text-amber-600"
                                      )}
                                    >
                                      {entry() && "totalXp" in (entry() as object)
                                        ? `${(entry() as { totalXp: number }).totalXp}`
                                        : `${(entry() as { wpm: number })?.wpm} WPM`}
                                    </span>
                                  </div>
                                </div>

                                {/* Pillar Base Label */}
                                <div class="mt-auto pt-3 pb-1 flex flex-col items-center justify-center gap-1">
                                  <span
                                    class={cn(
                                      "font-black tracking-wider uppercase",
                                      pos === 0
                                        ? "text-lg sm:text-xl md:text-2xl text-main"
                                        : pos === 1
                                          ? "text-base sm:text-lg md:text-xl text-text"
                                          : "text-base sm:text-lg md:text-xl text-amber-600"
                                    )}
                                  >
                                    {rankTitle()}
                                  </span>
                                </div>
                              </a>
                            </Show>
                          );
                        }}
                      </For>
                    </div>
                  </div>
                </Show>

                <div class="flex flex-col gap-3">
                  <For each={rest()}>
                    {(entry, i) => {
                      const e = entry as {
                        name: string;
                        uid: string;
                        wpm?: number;
                        totalXp?: number;
                        acc?: number;
                        avatar?: string | null;
                        discordId?: string;
                        discordAvatar?: string;
                      };
                      const isMe = () => e.uid === getUserId();
                      const idx = () =>
                        "rank" in e
                          ? (e as unknown as { rank: number }).rank
                          : page() === 0
                            ? i() + 3 + 1
                            : page() * 50 + i() + 1;
                      return (
                        <a
                          href={e.name ? `/profile/${e.name}` : e.uid ? `/profile/${e.uid}` : "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          class={cn(
                            "animate-in fade-in slide-in-from-bottom-4 fill-mode-both flex flex-row items-center gap-4 rounded-2xl px-6 py-4 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5",
                            isMe()
                              ? "border-2 border-main bg-gradient-to-r from-main/20 to-main/5 shadow-[0_0_20px_-5px_rgba(255,90,31,0.3)]"
                              : "border border-sub-alt bg-sub-alt/25 hover:border-sub hover:bg-sub-alt/40 hover:shadow-md cursor-pointer",
                          )}
                          style={{ "animation-delay": `${(i() % 10) * 50}ms` }}
                        >
                          <div class="flex w-12 items-center justify-center">
                            <span
                              class={cn(
                                "text-xl font-black italic tracking-tighter",
                                isMe() ? "text-main" : "text-sub/50",
                              )}
                            >
                              #{idx()}
                            </span>
                          </div>
                          
                          <div class="flex flex-1 items-center gap-3">
                            <div class="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-full bg-sub-alt flex items-center justify-center overflow-hidden border border-sub-alt/60">
                              <Show
                                when={e.avatar ?? e.discordAvatar}
                                fallback={
                                  <span class="text-xs font-black text-text uppercase select-none">
                                    {e.name?.[0] ?? "U"}
                                  </span>
                                }
                              >
                                <DiscordAvatar
                                  discordId={e.discordId}
                                  discordAvatar={e.discordAvatar}
                                  avatar={e.avatar}
                                  size={64}
                                  class="h-full w-full object-cover text-3xl sm:text-4xl"
                                />
                              </Show>
                            </div>
                            <User
                              user={e as unknown as Parameters<typeof User>[0]["user"]}
                              avatarFallback="user-circle"
                              avatarColor={isMe() ? "text" : "sub"}
                              flagsColor="sub"
                              class="text-base font-bold"
                              linkToProfile={false}
                              showAvatar={false}
                            />
                            <div class="flex items-center gap-1 rounded-full bg-sub-alt/50 border border-sub-alt/80 px-2 py-0.5 text-[11px] font-black text-sub">
                              <i class="fas fa-shield-alt text-[9px] text-sub"></i>
                              <span>Lv {getUserLevel(e)}</span>
                            </div>
                            <Show when={isMe()}>
                              <span class="rounded-lg bg-main/20 px-2.5 py-0.5 text-[10px] font-black text-main uppercase tracking-widest">
                                Siz
                              </span>
                            </Show>
                          </div>
                          
                          <div class="flex items-center justify-end gap-6 sm:gap-12">
                            <Show when={e.acc}>
                              <div class="hidden sm:flex flex-col items-end">
                                <span class="text-xs font-semibold text-sub uppercase tracking-wider">Aniqlik</span>
                                <span class="text-sm font-bold text-text">{e.acc}%</span>
                              </div>
                            </Show>
                            <div class="flex flex-col items-end">
                              <span class="text-xs font-semibold text-sub uppercase tracking-wider">
                                {"totalXp" in entry ? "Tajriba" : "Tezlik"}
                              </span>
                              <div class="flex items-center gap-1.5">
                                <i class="fas fa-star text-amber-400 text-sm"></i>
                                <span
                                  class={cn(
                                    "text-xl sm:text-2xl font-black tracking-tight",
                                    isMe() ? "text-main drop-shadow-md" : "text-text",
                                  )}
                                >
                                  {"totalXp" in entry
                                    ? `${(entry as { totalXp: number }).totalXp} XP`
                                    : `${(entry as { wpm: number }).wpm} WPM`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </a>
                      );
                    }}
                  </For>
                </div>

                {/* Current user fixed card at bottom if not in current page list */}
                <Show
                  when={
                    isAuthenticated() &&
                    rankQuery.data &&
                    !entries().some((e) => (e as unknown as { uid?: string }).uid === getUserId())
                  }
                >
                  <div class="mt-6 flex items-center gap-4 rounded-2xl border-2 border-main/50 bg-main/10 px-6 py-4 shadow-xl backdrop-blur-md">
                    <div class="flex items-center gap-2">
                      <span class="rounded-lg bg-main px-2.5 py-1 text-xs font-black text-bg uppercase">
                        Siz
                      </span>
                      <span class="text-xl font-black text-main">
                        #{(rankQuery.data as unknown as { rank: number }).rank}
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
                        ? "wpm" in (rankQuery.data as object)
                          ? `${(rankQuery.data as unknown as { wpm: number }).wpm} WPM`
                          : "totalXp" in (rankQuery.data as object)
                            ? `${(rankQuery.data as unknown as { totalXp: number }).totalXp} XP`
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

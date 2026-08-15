import type { Language } from "@typeuz/schemas/languages";

import { useQuery } from "@tanstack/solid-query";
import { For, JSXElement, Show, createSignal, createEffect } from "solid-js";

import {
  getLeaderboardQueryOptions,
  getRankQueryOptions,
} from "../../../queries/leaderboards";
import { getActivePage, isAuthenticated } from "../../../states/core";
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

const languageOptions: { value: Language; label: string }[] = [
  { value: "uzbek", label: "O'zbek" },
  { value: "english", label: "English" },
  { value: "russian", label: "Русский" },
];

const contentTypeOptions: { value: "" | "words" | "mixed"; label: string }[] = [
  { value: "words", label: "So'zlar" },
  { value: "mixed", label: "Aralash" },
];

type LbType = "allTime" | "weekly";

const LbTABS: { id: LbType; label: string; icon: string }[] = [
  { id: "allTime", label: "Tezlik", icon: "fa-tachometer-alt" },
  { id: "weekly", label: "Tajriba (XP)", icon: "fa-star" },
];

export function LeaderboardPage(): JSXElement {
  const [lbType, setLbType] = createSignal<LbType>("allTime");

  const isOpen = () => getActivePage() === pageName;

  const selection = () => getSelection();
  const page = () => getPage();

  const effectiveSelection = () => {
    const s = selection();
    if (lbType() === "weekly") {
      return {
        ...s,
        type: "weekly" as const,
        mode: undefined,
        mode2: undefined,
        language: undefined,
        numbers: undefined,
      };
    }
    return {
      ...s,
      type: "allTime" as const,
      mode: (s as { mode?: string }).mode ?? "time",
      mode2: (s as { mode2?: string }).mode2 ?? "15",
      language: (s as { language?: Language }).language ?? "uzbek",
    };
  };

  const sel = () => effectiveSelection();

  const lbQuery = useQuery(() => ({
    ...getLeaderboardQueryOptions({
      ...effectiveSelection(),
      page: page(),
    } as never),
    enabled: isOpen(),
  }));

  const rankQuery = useQuery(() => ({
    ...getRankQueryOptions(effectiveSelection() as never),
    enabled: isOpen() && isAuthenticated(),
  }));

  const goToPage = (dir: -1 | 1) => {
    const next = page() + dir;
    if (next < 0) return;
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  createEffect(() => {
    updateGetParameters(
      sel() as unknown as Parameters<typeof updateGetParameters>[0],
      page(),
    );
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
                  onClick={() => setLbType(tab.id)}
                  class={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                    lbType() === tab.id
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

          <div class="flex flex-wrap items-center gap-3">
            <Show when={lbType() !== "weekly"}>
              <div class="flex items-center gap-3">
                <select
                  class="rounded-lg border border-sub-alt bg-sub-alt px-3 py-1.5 text-sm text-text outline-none focus:border-main"
                  value={sel().language}
                  onChange={(e) =>
                    setSelection({
                      ...sel(),
                      language: e.currentTarget.value as Language,
                    } as never)
                  }
                >
                  <For each={languageOptions}>
                    {(lang) => <option value={lang.value}>{lang.label}</option>}
                  </For>
                </select>

                <select
                  class="rounded-lg border border-sub-alt bg-sub-alt px-3 py-1.5 text-sm text-text outline-none focus:border-main"
                  value={sel().mode2}
                  onChange={(e) =>
                    setSelection({
                      ...sel(),
                      mode2: e.currentTarget.value,
                    } as never)
                  }
                >
                  <For each={durationOptions}>
                    {(d) => <option value={d}>{`${d}s`}</option>}
                  </For>
                </select>

                <select
                  class="rounded-lg border border-sub-alt bg-sub-alt px-3 py-1.5 text-sm text-text outline-none focus:border-main"
                  value={
                    sel().numbers === undefined
                      ? "words"
                      : sel().numbers
                        ? "mixed"
                        : "words"
                  }
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    if (v === "words") {
                      setSelection({ ...sel(), numbers: false } as never);
                    } else {
                      setSelection({ ...sel(), numbers: true } as never);
                    }
                  }}
                >
                  <For each={contentTypeOptions}>
                    {(ct) => <option value={ct.value}>{ct.label}</option>}
                  </For>
                </select>
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
                      const idx = () =>
                        "rank" in e
                          ? (e as unknown as { rank: number }).rank
                          : page() === 0
                            ? i() + 3 + 1
                            : page() * 50 + i() + 1;
                      return (
                        <div
                          class={cn(
                            "animate-in fade-in slide-in-from-bottom-4 fill-mode-both flex items-center gap-4 rounded-2xl bg-sub-alt/40 px-5 py-3 transition-colors duration-300 hover:bg-sub-alt",
                          )}
                          style={{ "animation-delay": `${(i() % 10) * 50}ms` }}
                        >
                          <span class="w-8 text-center text-lg font-bold text-sub">
                            #{idx()}
                          </span>
                          <div class="flex flex-1 items-center gap-3">
                            <User
                              user={e}
                              avatarFallback="user-circle"
                              avatarColor="sub"
                              flagsColor="sub"
                              class="text-base"
                              linkToProfile={true}
                            />
                            <Show when={e.acc}>
                              <span class="text-xs text-sub/60">
                                {e.acc}% aniqlik
                              </span>
                            </Show>
                          </div>
                          <span class="text-sm font-medium text-text">
                            {"totalXp" in entry
                              ? `${(entry as { totalXp: number }).totalXp} XP`
                              : `${(entry as { wpm: number }).wpm} WPM`}
                          </span>
                        </div>
                      );
                    }}
                  </For>
                </div>
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

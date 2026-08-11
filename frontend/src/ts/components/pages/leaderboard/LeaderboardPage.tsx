import type { Language } from "@typeuz/schemas/languages";

import { useQuery } from "@tanstack/solid-query";
import { For, JSXElement, Show, createSignal } from "solid-js";

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
} from "../../../states/leaderboard-selection";
import { cn } from "../../../utils/cn";
import AsyncContent from "../../common/AsyncContent";
import { Page } from "../../common/Page";
import { TypeUZAdSlot } from "../../common/TypeUZAdSlot";
import { SelectField } from "../../ui/form/SelectField";

const pageName = "leaderboards";

const durationOptions = ["15", "30", "60", "120", "custom"] as const;

const languageOptions: { value: Language; label: string }[] = [
  { value: "uzbek", label: "O'zbek" },
  { value: "english", label: "English" },
  { value: "russian", label: "Русский" },
];

const contentTypeOptions: { value: "" | "words" | "mixed"; label: string }[] = [
  { value: "", label: "Barcha" },
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
      language: (s as { language?: Language }).language ?? "english",
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
  };

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
              <SelectField
                value={sel().mode2}
                onChange={(v) => setSelection({ ...sel(), mode2: v } as never)}
                options={durationOptions.map((d) => ({
                  value: d,
                  label: d === "custom" ? "Maxsus" : `${d} sek`,
                }))}
                class="bg-sub-alt px-3 py-1.5"
              />

              <SelectField
                value={sel().language}
                onChange={(v) =>
                  setSelection({ ...sel(), language: v as Language } as never)
                }
                options={languageOptions}
                class="bg-sub-alt px-3 py-1.5"
              />

              <div class="flex items-center gap-1 rounded-xl border border-sub-alt bg-sub-alt px-3 py-1.5">
                <For each={contentTypeOptions}>
                  {(ct) => {
                    const active =
                      ct.value === ""
                        ? sel().numbers === undefined
                        : ct.value === "words"
                          ? sel().numbers === false
                          : sel().numbers === true;
                    return (
                      <button
                        type="button"
                        class={cn(
                          "rounded-lg px-2 py-0.5 text-sm transition-colors",
                          active
                            ? "bg-main text-bg"
                            : "text-sub hover:text-text",
                        )}
                        onClick={() => {
                          if (ct.value === "") {
                            setSelection({
                              ...sel(),
                              numbers: undefined,
                            } as never);
                          } else if (ct.value === "words") {
                            setSelection({ ...sel(), numbers: false } as never);
                          } else {
                            setSelection({ ...sel(), numbers: true } as never);
                          }
                        }}
                      >
                        {ct.label}
                      </button>
                    );
                  }}
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
            return (
              <div class="flex flex-col gap-2">
                <For each={entries()}>
                  {(entry, i) => {
                    const e = entry as {
                      name: string;
                      firstName?: string;
                      lastName?: string;
                      wpm?: number;
                      totalXp?: number;
                      acc?: number;
                    };
                    const idx = () => page() * 50 + i();
                    return (
                      <div
                        class={cn(
                          "flex items-center gap-4 rounded-2xl px-5 py-3 transition-colors",
                          idx() <= 2
                            ? "bg-sub-alt"
                            : "bg-sub-alt/50 hover:bg-sub-alt",
                        )}
                      >
                        <span class="w-8 text-center text-lg font-bold text-sub">
                          {idx() === 0
                            ? "🥇"
                            : idx() === 1
                              ? "🥈"
                              : idx() === 2
                                ? "🥉"
                                : `#${idx() + 1}`}
                        </span>
                        <span class="flex flex-1 flex-col">
                          <span class="font-medium text-text">{e.name}</span>
                          <Show when={e.acc}>
                            <span class="text-xs text-sub/60">
                              {e.acc}% aniqlik
                            </span>
                          </Show>
                        </span>
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
            );
          }}
        </AsyncContent>

        <div class="flex items-center justify-center gap-4">
          <button
            onClick={() => goToPage(-1)}
            type="button"
            disabled={page() === 0}
            class="rounded-xl bg-sub-alt px-4 py-2 text-sm text-text transition-colors hover:bg-sub disabled:opacity-30"
          >
            Oldingi
          </button>
          <span class="text-sm text-sub">{page() + 1}-sahifa</span>
          <button
            type="button"
            onClick={() => goToPage(1)}
            class="rounded-xl bg-sub-alt px-4 py-2 text-sm text-text transition-colors hover:bg-sub"
          >
            Keyingi
          </button>
        </div>
      </div>
    </Page>
  );
}

// oxlint-disable typescript/no-explicit-any, react/no-unescaped-entities
import { PersonalBest, PersonalBests } from "@typeuz/schemas/shared";
import {
  RankAndCount,
  UserProfile as UserProfileType,
} from "@typeuz/schemas/users";
import { formatDate } from "date-fns/format";
import { createMemo, createResource, For, JSXElement, Show } from "solid-js";

import Ape from "../../../ape";
import * as PbTablesModal from "../../../modals/pb-tables";
import {
  getFormatting,
  isAuthenticated,
  getUserId,
} from "../../../states/core";
import { cn } from "../../../utils/cn";
import { formatTopPercentage } from "../../../utils/misc";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { ActivityCalendar } from "./ActivityCalendar";
import { UserDetails } from "./UserDetails";

function StatsOverview(props: { profile: UserProfileType }): JSXElement {
  const totalTimeHours = () =>
    Math.round(((props.profile.typingStats?.timeTyping ?? 0) / 3600) * 10) / 10;
  const totalTests = () => props.profile.typingStats?.completedTests ?? 0;

  return (
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="flex flex-col items-start gap-1 rounded-md border-2 border-sub-alt/50 bg-bg p-6 shadow-sm transition-colors hover:border-sub-alt">
        <span class="text-xs font-bold tracking-wider text-sub uppercase">
          Testlar
        </span>
        <span class="mt-1 text-3xl font-black tracking-tight text-text">
          {totalTests()}
        </span>
      </div>
      <div class="flex flex-col items-start gap-1 rounded-md border-2 border-sub-alt/50 bg-bg p-6 shadow-sm transition-colors hover:border-sub-alt">
        <span class="text-xs font-bold tracking-wider text-sub uppercase">
          Vaqt
        </span>
        <span class="mt-1 text-3xl font-black tracking-tight text-text">
          {totalTimeHours()}h
        </span>
      </div>
      <div class="flex flex-col items-start gap-1 rounded-md border-2 border-sub-alt/50 bg-bg p-6 shadow-sm transition-colors hover:border-sub-alt">
        <span class="text-xs font-bold tracking-wider text-sub uppercase">
          XP
        </span>
        <span class="mt-1 text-3xl font-black tracking-tight text-text">
          {props.profile.xp ?? 0}
        </span>
      </div>
      <div class="flex flex-col items-start gap-1 rounded-md border-2 border-sub-alt/50 bg-bg p-6 shadow-sm transition-colors hover:border-sub-alt">
        <span class="text-xs font-bold tracking-wider text-sub uppercase">
          Streak
        </span>
        <span class="mt-1 text-3xl font-black tracking-tight text-text">
          {props.profile.streak ?? 0}
        </span>
      </div>
    </div>
  );
}

function WeeklyAnalysis(): JSXElement {
  const [analysis] = createResource(
    () => (isAuthenticated() ? "fetch" : null),
    async () => {
      try {
        const res = await Ape.users.getWeeklyAnalysis();
        if (res.status !== 200) throw new Error("Failed to fetch analysis");
        return res.body.data;
      } catch (e) {
        throw e;
      }
    },
  );

  return (
    <div class="relative overflow-hidden rounded-md border-2 border-sub-alt/50 bg-bg p-8 shadow-sm">
      <Show when={analysis.error !== undefined}>
        <div class="bg-red-500/10 border-red-500/20 mb-4 rounded-xl border p-4 text-center">
          <span class="text-red-400 text-sm font-medium">
            Tahlilni yuklashda xatolik yuz berdi.
          </span>
        </div>
      </Show>
      <Show
        when={
          !analysis.loading &&
          analysis.error === undefined &&
          analysis() === null
        }
      >
        <span class="text-sm font-medium text-sub">
          Tahlil uchun profilingizga kiring yoki ko&apos;proq test topshiring.
        </span>
      </Show>
      <Show when={analysis.loading}>
        <div class="flex flex-col gap-4">
          <div class="h-6 w-48 animate-pulse rounded-lg bg-text/5"></div>
          <div class="h-4 w-72 animate-pulse rounded-lg bg-text/5"></div>
          <div class="h-4 w-56 animate-pulse rounded-lg bg-text/5"></div>
        </div>
      </Show>
      <Show when={analysis() !== undefined && analysis() !== null}>
        <div class="relative z-10 flex flex-col gap-6">
          <div class="flex items-center gap-3">
            <span class="text-xl font-bold tracking-tight text-text">
              Haftalik AI tahlili
            </span>
          </div>

          <div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div class="flex flex-col gap-1 border-l-[3px] border-main pl-4">
              <span class="text-[10px] font-bold tracking-wider text-sub uppercase">
                O&apos;rtacha WPM
              </span>
              <div class="text-2xl font-black text-text">
                {(analysis()?.avgWpm ?? 0).toFixed(1)}
              </div>
            </div>
            <div class="flex flex-col gap-1 border-l-[3px] border-main pl-4">
              <span class="text-[10px] font-bold tracking-wider text-sub uppercase">
                O&apos;rtacha aniqlik
              </span>
              <div class="text-2xl font-black text-text">
                {(analysis()?.avgAccuracy ?? 0).toFixed(1)}%
              </div>
            </div>
            <div class="flex flex-col gap-1 border-l-[3px] border-main pl-4">
              <span class="text-[10px] font-bold tracking-wider text-sub uppercase">
                Jami testlar
              </span>
              <div class="text-2xl font-black text-text">
                {analysis()?.totalTests}
              </div>
            </div>
            <div class="flex flex-col gap-1 border-l-[3px] border-main pl-4">
              <span class="text-[10px] font-bold tracking-wider text-sub uppercase">
                Eng yaxshi WPM
              </span>
              <div class="text-2xl font-black text-text">
                {analysis()?.bestWpm}
              </div>
            </div>
          </div>

          <div class="mt-2 flex flex-wrap items-center gap-6">
            <Show when={analysis()?.trend === "improving"}>
              <div class="bg-green-500/10 text-green-500 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold">
                <Fa icon="fa-arrow-up" /> O&apos;sish kuzatilmoqda
              </div>
            </Show>
            <Show when={analysis()?.trend === "declining"}>
              <div class="bg-red-500/10 text-red-500 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold">
                <Fa icon="fa-arrow-down" /> Pasayish
              </div>
            </Show>
            <Show when={analysis()?.trend === "stable"}>
              <div class="flex items-center gap-2 rounded-full bg-sub/10 px-4 py-1.5 text-sm font-bold text-sub">
                <Fa icon="fa-minus" /> Barqaror
              </div>
            </Show>
            <Show when={analysis()?.bestDay}>
              <div class="text-sm font-medium text-sub">
                Haftaning eng zo&apos;r kuni:{" "}
                <span class="font-bold text-text">{analysis()?.bestDay}</span>
              </div>
            </Show>
          </div>

          <Show when={(analysis()?.dailyBreakdown.length ?? 0) > 0}>
            <div class="mt-4 flex h-32 items-end justify-between gap-2 rounded-md border-2 border-sub-alt/50 bg-bg p-4">
              <For each={analysis()?.dailyBreakdown ?? []}>
                {(day) => (
                  <div class="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
                    <div class="absolute -top-8 hidden rounded bg-text px-2 py-1 text-xs font-bold whitespace-nowrap text-bg opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                      {day.wpm} wpm
                    </div>
                    <div
                      class="w-full max-w-[40px] rounded-t-sm bg-sub-alt transition-all group-hover:bg-main"
                      style={{
                        height: `${Math.max(
                          4,
                          (day.wpm /
                            Math.max(
                              1,
                              ...(analysis()?.dailyBreakdown ?? []).map(
                                (d) => d.wpm,
                              ),
                            )) *
                            100,
                        )}%`,
                      }}
                    ></div>
                    <span class="text-[10px] font-bold text-sub uppercase">
                      {day.date.slice(5)}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </Show>

          <Show
            when={
              analysis()?.recommendation !== undefined &&
              analysis()?.recommendation !== ""
            }
          >
            <div class="mt-2 flex items-start gap-3 rounded-md border-l-4 border-main bg-main/5 p-4">
              <p class="text-sm leading-relaxed font-medium text-text">
                <span class="mr-2 font-bold text-main">Tavsiya:</span>
                {analysis()?.recommendation}
              </p>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

import { TypeUZAdSlot } from "../../common/TypeUZAdSlot";

export function UserProfile(props: {
  profile: UserProfileType;
  isAccountPage?: true;
}): JSXElement {
  const isUsersProfile = () =>
    props.profile.uid !== undefined &&
    props.profile.uid === (getUserId() ?? "");

  return (
    <div class="animate-fade-in-up mx-auto grid w-full max-w-[1200px] gap-8">
      <TypeUZAdSlot slotId="ad-account-1" class="w-full" />

      <UserDetails
        profile={props.profile}
        isAccountPage={props.isAccountPage}
      />

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <div class="lg:col-span-4">
          <StatsOverview profile={props.profile} />
        </div>
      </div>

      <Show when={isUsersProfile()}>
        <WeeklyAnalysis />
      </Show>

      <Show when={props.profile.lastResult}>
        <LastTestCard lastResult={props.profile.lastResult} />
      </Show>

      <Show when={!props.profile.banned && !props.profile.lbOptOut}>
        <LeaderboardPosition
          top15={
            props.profile.allTimeLbs?.time?.["15"]?.["uzbek"] ??
            props.profile.allTimeLbs?.time?.["15"]?.["english"]
          }
          top60={
            props.profile.allTimeLbs?.time?.["60"]?.["uzbek"] ??
            props.profile.allTimeLbs?.time?.["60"]?.["english"]
          }
        />
      </Show>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div class="rounded-2xl border border-sub/5 bg-gradient-to-b from-sub-alt/40 to-bg p-6 shadow-sm backdrop-blur-sm">
          <PbTable
            mode="time"
            mode2={["10", "15", "30", "60", "120"]}
            pbs={props.profile.personalBests.time}
            isAccountPage={props.isAccountPage}
          />
        </div>
        <div class="rounded-2xl border border-sub/5 bg-gradient-to-b from-sub-alt/40 to-bg p-6 shadow-sm backdrop-blur-sm">
          <PbTable
            mode="words"
            mode2={["10", "25", "50", "100"]}
            pbs={props.profile.personalBests.words}
            isAccountPage={props.isAccountPage}
          />
        </div>
      </div>

      <Show when={props.profile.lbOptOut}>
        <div class="border-red-500/20 bg-red-500/10 rounded-xl border p-4 text-center">
          <span class="text-red-400 text-sm font-medium">
            Diqqat: Ushbu akkaunt reytingdan chetlashtirilgan. Natijalar
            anticheat tizimi tomonidan tasdiqlanmagan bo&apos;lishi mumkin.
          </span>
        </div>
      </Show>

      <div class="rounded-3xl border border-sub/5 bg-sub-alt/30 p-8 shadow-sm backdrop-blur-sm">
        <ActivityCalendar
          testActivity={
            props.isAccountPage ? undefined : props.profile.testActivity
          }
          isAccountPage={props.isAccountPage}
        />
      </div>

      <TypeUZAdSlot slotId="ad-account-2" class="w-full" />
    </div>
  );
}

function LeaderboardPosition(props: {
  top15?: RankAndCount;
  top60?: RankAndCount;
}): JSXElement {
  const format = getFormatting;

  return (
    <div class="grid w-full grid-cols-1 items-center gap-6 rounded-2xl border border-sub/5 bg-sub-alt/40 p-6 text-sub shadow-sm md:grid-cols-3">
      <span class="text-sm font-bold tracking-widest text-text uppercase md:col-span-1">
        Barcha Vaqtlar Reytingi
      </span>
      <Show when={props.top15 !== undefined}>
        <div class="flex items-center justify-between gap-4 rounded-xl border border-sub/5 bg-bg/50 p-4">
          <div class="flex flex-col">
            <span class="text-xs font-bold tracking-wider text-sub uppercase">
              15 soniya
            </span>
            <span class="text-xs text-main">
              {formatTopPercentage(props.top15)}
            </span>
          </div>
          <div class="text-3xl font-black text-text">
            {format().rank(props.top15?.rank)}
          </div>
        </div>
      </Show>
      <Show when={props.top60 !== undefined}>
        <div class="flex items-center justify-between gap-4 rounded-xl border border-sub/5 bg-bg/50 p-4">
          <div class="flex flex-col">
            <span class="text-xs font-bold tracking-wider text-sub uppercase">
              60 soniya
            </span>
            <span class="text-xs text-main">
              {formatTopPercentage(props.top60)}
            </span>
          </div>
          <div class="text-3xl font-black text-text">
            {format().rank(props.top60?.rank)}
          </div>
        </div>
      </Show>
    </div>
  );
}

function PbTable<M extends "time" | "words">(props: {
  mode: M;
  mode2: string[];
  pbs: PersonalBests[M];
  isAccountPage?: true;
}): JSXElement {
  const format = getFormatting;

  const bests = createMemo(() =>
    props.mode2.map((mode) => {
      const pbArray = props.pbs[mode] ?? [];
      const best = pbArray.reduce<PersonalBest | undefined>(
        (max, current) => (current.wpm > (max?.wpm ?? 0) ? current : max),
        undefined,
      );
      return { mode2: mode, pb: best };
    }),
  );

  return (
    <div class="relative grid grid-cols-[1fr_minmax(0,2rem)] overflow-hidden rounded-2xl border border-sub/5 bg-sub-alt/40">
      <div class="grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
        <For each={bests()}>
          {(item) => (
            <div class="group relative flex cursor-default flex-col items-center justify-center rounded-xl p-4 transition-colors hover:bg-sub-alt/60">
              <div
                class={cn(
                  "flex flex-col items-center gap-1 text-center transition-all duration-300",
                  item.pb !== undefined &&
                    "group-hover:-translate-y-2 group-hover:opacity-0",
                )}
              >
                <div class="text-[10px] font-bold tracking-widest text-sub uppercase">
                  {item.mode2} {props.mode === "time" ? "soniya" : "so'z"}
                </div>
                <div class="mt-1 text-4xl font-black text-text">
                  {item.pb !== undefined
                    ? format().typingSpeed(item.pb?.wpm, {
                        showDecimalPlaces: false,
                      })
                    : "-"}
                </div>
                <Show when={item.pb !== undefined}>
                  <div class="text-sm font-semibold text-main">
                    {format().accuracy(item.pb?.acc, {
                      showDecimalPlaces: false,
                    })}
                    %
                  </div>
                </Show>
              </div>

              <Show when={item.pb !== undefined}>
                <div class="absolute inset-0 flex translate-y-2 flex-col items-center justify-center gap-1 rounded-xl border border-sub/10 bg-sub-alt opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <div class="mb-1 text-[10px] font-bold tracking-widest text-sub uppercase">
                    {item.mode2} {props.mode === "time" ? "soniya" : "so'z"}
                  </div>
                  <div class="text-sm font-bold text-text">
                    {format().typingSpeed(item.pb?.wpm)} wpm
                  </div>
                  <div class="text-xs text-sub">
                    {format().typingSpeed(item.pb?.raw)} raw
                  </div>
                  <div class="text-xs text-sub">
                    {format().accuracy(item.pb?.acc)} acc
                  </div>
                  <div class="text-xs text-sub">
                    {format().percentage(item.pb?.consistency)} con
                  </div>
                  <div class="mt-1 text-[10px] text-sub/70">
                    {formatDate(item.pb?.timestamp ?? 0, "dd MMM yyyy")}
                  </div>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
      <Show when={props.isAccountPage}>
        <div class="flex flex-col border-l border-sub/5 bg-sub-alt/20 transition-colors hover:bg-sub-alt/60">
          <Button
            balloon={{ text: "Barcha shaxsiy rekordlar", position: "left" }}
            class="flex h-full w-full items-center justify-center rounded-none text-sub hover:text-main"
            fa={{ icon: "fa-ellipsis-v" }}
            onClick={() => PbTablesModal.show(props.mode)}
          />
        </div>
      </Show>
    </div>
  );
}

function LastTestCard(props: {
  lastResult: Record<string, unknown>;
}): JSXElement {
  const [expanded, setExpanded] = createSignal(false);
  const lr = () => props.lastResult as Record<string, any>;

  return (
    <div class="overflow-hidden rounded-2xl border border-sub/10 bg-sub-alt/30 p-6 shadow-sm backdrop-blur-sm transition-all">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-sub/10 pb-4">
        <div class="flex items-center gap-3">
          <div class="grid h-10 w-10 place-items-center rounded-xl bg-main/20 text-main">
            <Fa icon="fa-chart-line" class="text-lg" />
          </div>
          <div>
            <h3 class="text-base font-bold text-text">So&apos;nggi test natijasi</h3>
            <span class="text-xs text-sub">
              {lr().timestamp
                ? formatDate(lr().timestamp, "dd MMM yyyy, HH:mm")
                : "Yaqinda topshirilgan"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded())}
          class="flex items-center gap-2 rounded-xl bg-sub-alt/60 px-4 py-2 text-xs font-bold text-text transition-colors hover:bg-main hover:text-bg"
        >
          <span>{expanded() ? "Yopish" : "To'liq statistika"}</span>
          <Fa icon={expanded() ? "fa-chevron-up" : "fa-chevron-down"} />
        </button>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div class="flex flex-col gap-1 rounded-xl bg-bg/50 p-4">
          <span class="text-[10px] font-bold tracking-widest text-sub uppercase">
            Tezlik (WPM)
          </span>
          <span class="text-2xl font-black text-main">{lr().wpm ?? 0}</span>
        </div>
        <div class="flex flex-col gap-1 rounded-xl bg-bg/50 p-4">
          <span class="text-[10px] font-bold tracking-widest text-sub uppercase">
            Aniqlik
          </span>
          <span class="text-2xl font-black text-text">{lr().acc ?? 100}%</span>
        </div>
        <div class="flex flex-col gap-1 rounded-xl bg-bg/50 p-4">
          <span class="text-[10px] font-bold tracking-widest text-sub uppercase">
            Xom tezlik (Raw)
          </span>
          <span class="text-2xl font-black text-text">
            {lr().rawWpm ?? lr().wpm ?? 0}
          </span>
        </div>
        <div class="flex flex-col gap-1 rounded-xl bg-bg/50 p-4">
          <span class="text-[10px] font-bold tracking-widest text-sub uppercase">
            Konsistensiya
          </span>
          <span class="text-2xl font-black text-text">
            {lr().consistency ? Math.round(lr().consistency) : 100}%
          </span>
        </div>
      </div>

      <Show when={expanded()}>
        <div class="mt-4 animate-in fade-in slide-in-from-top-2 rounded-xl border border-sub/10 bg-bg/70 p-4 text-xs">
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <span class="text-sub">Rejim: </span>
              <span class="font-bold text-text uppercase">
                {lr().mode} {lr().mode2}
              </span>
            </div>
            <div>
              <span class="text-sub">Til: </span>
              <span class="font-bold text-text">{lr().language ?? "uzbek"}</span>
            </div>
            <div>
              <span class="text-sub">Davomiylik: </span>
              <span class="font-bold text-text">{lr().testDuration ?? 0}s</span>
            </div>
            <div>
              <span class="text-sub">AFK vaqti: </span>
              <span class="font-bold text-text">{lr().afkDuration ?? 0}s</span>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

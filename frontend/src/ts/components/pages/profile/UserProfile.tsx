import { PersonalBest, PersonalBests } from "@typeuz/schemas/shared";
import {
  RankAndCount,
  UserProfile as UserProfileType,
} from "@typeuz/schemas/users";
import { formatDate } from "date-fns/format";
import {
  createMemo,
  createResource,
  For,
  JSXElement,
  Show,
} from "solid-js";

import * as PbTablesModal from "../../../modals/pb-tables";
import { getFormatting, isAuthenticated, getUserId } from "../../../states/core";
import { formatTopPercentage } from "../../../utils/misc";
import { cn } from "../../../utils/cn";
import Ape from "../../../ape";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { ActivityCalendar } from "./ActivityCalendar";
import { UserDetails } from "./UserDetails";

function StatsOverview(props: {
  profile: UserProfileType;
}): JSXElement {
  const totalTimeHours = () => Math.round((props.profile.typingStats?.timeTyping ?? 0) / 3600 * 10) / 10;
  const totalTests = () => props.profile.typingStats?.completedTests ?? 0;

  return (
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="flex flex-col items-center gap-2 rounded-2xl bg-sub-alt/40 p-6 shadow-sm border border-sub/5 hover:bg-sub-alt/60 transition-colors">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-main/10 text-main mb-2">
          <Fa icon="fa-keyboard" class="text-xl" />
        </div>
        <span class="text-3xl font-black tracking-tight text-text">{totalTests()}</span>
        <span class="text-xs font-semibold tracking-wider text-sub uppercase">Testlar</span>
      </div>
      <div class="flex flex-col items-center gap-2 rounded-2xl bg-sub-alt/40 p-6 shadow-sm border border-sub/5 hover:bg-sub-alt/60 transition-colors">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-main/10 text-main mb-2">
          <Fa icon="fa-clock" class="text-xl" />
        </div>
        <span class="text-3xl font-black tracking-tight text-text">{totalTimeHours()}h</span>
        <span class="text-xs font-semibold tracking-wider text-sub uppercase">Vaqt</span>
      </div>
      <div class="flex flex-col items-center gap-2 rounded-2xl bg-sub-alt/40 p-6 shadow-sm border border-sub/5 hover:bg-sub-alt/60 transition-colors">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-main/10 text-main mb-2">
          <Fa icon="fa-star" class="text-xl" />
        </div>
        <span class="text-3xl font-black tracking-tight text-text">{props.profile.xp ?? 0}</span>
        <span class="text-xs font-semibold tracking-wider text-sub uppercase">XP</span>
      </div>
      <div class="flex flex-col items-center gap-2 rounded-2xl bg-sub-alt/40 p-6 shadow-sm border border-sub/5 hover:bg-sub-alt/60 transition-colors">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-main/10 text-main mb-2">
          <Fa icon="fa-fire" class="text-xl" />
        </div>
        <span class="text-3xl font-black tracking-tight text-text">{props.profile.streak ?? 0}</span>
        <span class="text-xs font-semibold tracking-wider text-sub uppercase">Streak</span>
      </div>
    </div>
  );
}

function WeeklyAnalysis(): JSXElement {
  const [analysis] = createResource(
    () => (isAuthenticated() ? "fetch" : null),
    async () => {
      const res = await Ape.users.getWeeklyAnalysis();
      if (res.status !== 200) return null;
      return res.body.data;
    },
  );

  return (
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sub-alt/80 to-sub-alt/30 p-8 shadow-sm border border-sub/10">
      <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-main/5 blur-3xl"></div>
      
      <Show when={!analysis.loading && analysis() === null}>
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
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-main/20 text-main shadow-inner">
              <Fa icon="fa-brain" class="text-lg" />
            </div>
            <span class="text-xl font-extrabold tracking-tight text-text">
              Haftalik AI tahlil
            </span>
          </div>
          
          <div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div class="flex flex-col gap-1 border-l-2 border-main/30 pl-3">
              <span class="text-xs font-bold tracking-wider text-sub uppercase">O&apos;rtacha WPM</span>
              <div class="text-3xl font-black text-text">
                {analysis()?.avgWpm.toFixed(1)}
              </div>
            </div>
            <div class="flex flex-col gap-1 border-l-2 border-main/30 pl-3">
              <span class="text-xs font-bold tracking-wider text-sub uppercase">O&apos;rtacha aniqlik</span>
              <div class="text-3xl font-black text-text">
                {analysis()?.avgAccuracy.toFixed(1)}%
              </div>
            </div>
            <div class="flex flex-col gap-1 border-l-2 border-main/30 pl-3">
              <span class="text-xs font-bold tracking-wider text-sub uppercase">Jami testlar</span>
              <div class="text-3xl font-black text-text">
                {analysis()?.totalTests}
              </div>
            </div>
            <div class="flex flex-col gap-1 border-l-2 border-main/30 pl-3">
              <span class="text-xs font-bold tracking-wider text-sub uppercase">Eng yaxshi WPM</span>
              <div class="text-3xl font-black text-main">
                {analysis()?.bestWpm}
              </div>
            </div>
          </div>
          
          <div class="flex flex-wrap items-center gap-6 mt-2">
            <Show when={analysis()?.trend === "improving"}>
              <div class="flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 text-sm font-bold text-green-500">
                <Fa icon="fa-arrow-up" /> O&apos;sish kuzatilmoqda
              </div>
            </Show>
            <Show when={analysis()?.trend === "declining"}>
              <div class="flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-1.5 text-sm font-bold text-red-500">
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
                Haftaning eng zo&apos;r kuni: <span class="font-bold text-text">{analysis()?.bestDay}</span>
              </div>
            </Show>
          </div>
          
          <Show when={(analysis()?.dailyBreakdown.length ?? 0) > 0}>
            <div class="mt-4 flex items-end justify-between gap-2 h-32 rounded-xl bg-bg/30 p-4 border border-sub/5">
              <For each={analysis()?.dailyBreakdown ?? []}>
                {(day) => (
                  <div class="group relative flex flex-1 flex-col items-center justify-end gap-2 h-full">
                    <div class="absolute -top-8 hidden whitespace-nowrap rounded bg-text px-2 py-1 text-xs font-bold text-bg opacity-0 transition-opacity group-hover:block group-hover:opacity-100">
                      {day.wpm} wpm
                    </div>
                    <div
                      class="w-full max-w-[40px] rounded-t-sm bg-main/80 transition-all group-hover:bg-main"
                      style={{
                        height: `${Math.max(
                          4,
                          (day.wpm / Math.max(1, ...((analysis()?.dailyBreakdown ?? []).map((d) => d.wpm)))) * 100,
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
          
          <Show when={analysis()?.recommendation}>
            <div class="mt-2 flex items-start gap-3 rounded-xl bg-main/5 p-4 border border-main/10">
              <Fa icon="fa-lightbulb" class="mt-1 text-main" />
              <p class="text-sm leading-relaxed text-text">
                <span class="font-bold text-main">Tavsiya: </span>
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
    <div class="grid w-full gap-8 max-w-[1200px] mx-auto animate-fade-in-up">
      <TypeUZAdSlot slotId="ad-account-1" class="w-full" />
      
      <UserDetails
        profile={props.profile}
        isAccountPage={props.isAccountPage}
      />
      
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="lg:col-span-4">
          <StatsOverview profile={props.profile} />
        </div>
      </div>
      
      <Show when={isUsersProfile()}>
        <WeeklyAnalysis />
      </Show>

      <Show when={!props.profile.banned && !props.profile.lbOptOut}>
        <LeaderboardPosition
          top15={props.profile.allTimeLbs?.time?.["15"]?.["english"]}
          top60={props.profile.allTimeLbs?.time?.["60"]?.["english"]}
        />
      </Show>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div class="rounded-2xl bg-gradient-to-b from-sub-alt/40 to-bg border border-sub/5 shadow-sm p-6 backdrop-blur-sm">
          <PbTable
            mode="time"
            mode2={["15", "30", "60", "120"]}
            pbs={props.profile.personalBests.time}
            isAccountPage={props.isAccountPage}
          />
        </div>
        <div class="rounded-2xl bg-gradient-to-b from-sub-alt/40 to-bg border border-sub/5 shadow-sm p-6 backdrop-blur-sm">
          <PbTable
            mode="words"
            mode2={["10", "25", "50", "100"]}
            pbs={props.profile.personalBests.words}
            isAccountPage={props.isAccountPage}
          />
        </div>
      </div>
      
      <Show when={props.profile.lbOptOut}>
        <div class="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
          <span class="text-sm font-medium text-red-400">
            Diqqat: Ushbu akkaunt reytingdan chetlashtirilgan. Natijalar anticheat tizimi tomonidan tasdiqlanmagan bo&apos;lishi mumkin.
          </span>
        </div>
      </Show>

      <div class="rounded-3xl bg-sub-alt/30 border border-sub/5 shadow-sm p-8 backdrop-blur-sm">
        <ActivityCalendar
          testActivity={
            props.isAccountPage ? undefined : props.profile.testActivity
          }
          isAccountPage={props.isAccountPage}
        />
      </div>

      <Show when={props.isAccountPage === true ? true : isUsersProfile()}>
        <WeeklyAnalysis />
      </Show>

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
    <div class="grid w-full grid-cols-1 items-center gap-6 rounded-2xl bg-sub-alt/40 p-6 text-sub shadow-sm border border-sub/5 md:grid-cols-3">
      <span class="text-sm font-bold tracking-widest text-text uppercase md:col-span-1">
        Barcha Vaqtlar (Ingliz) Reytingi
      </span>
      <Show when={props.top15 !== undefined}>
        <div class="flex items-center justify-between gap-4 rounded-xl bg-bg/50 p-4 border border-sub/5">
          <div class="flex flex-col">
            <span class="text-xs font-bold uppercase tracking-wider text-sub">15 soniya</span>
            <span class="text-xs text-main">{formatTopPercentage(props.top15)}</span>
          </div>
          <div class="text-3xl font-black text-text">
            {format().rank(props.top15?.rank)}
          </div>
        </div>
      </Show>
      <Show when={props.top60 !== undefined}>
        <div class="flex items-center justify-between gap-4 rounded-xl bg-bg/50 p-4 border border-sub/5">
          <div class="flex flex-col">
            <span class="text-xs font-bold uppercase tracking-wider text-sub">60 soniya</span>
            <span class="text-xs text-main">{formatTopPercentage(props.top60)}</span>
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
    <div class="relative grid grid-cols-[1fr_minmax(0,2rem)] rounded-2xl bg-sub-alt/40 border border-sub/5 overflow-hidden">
      <div class="grid grid-cols-2 gap-6 p-6 md:grid-cols-4">
        <For each={bests()}>
          {(item) => (
            <div class="group relative flex flex-col items-center justify-center rounded-xl p-4 transition-colors hover:bg-sub-alt/60 cursor-default">
              <div
                class={cn("flex flex-col items-center gap-1 text-center transition-all duration-300", 
                  item.pb !== undefined && "group-hover:opacity-0 group-hover:-translate-y-2")}
              >
                <div class="text-[10px] font-bold tracking-widest text-sub uppercase">
                  {item.mode2} {props.mode === "time" ? "soniya" : "so'z"}
                </div>
                <div class="text-4xl font-black text-text mt-1">
                  {item.pb !== undefined ? format().typingSpeed(item.pb?.wpm, { showDecimalPlaces: false }) : "-"}
                </div>
                <Show when={item.pb !== undefined}>
                  <div class="text-sm font-semibold text-main">
                    {format().accuracy(item.pb?.acc, { showDecimalPlaces: false })}%
                  </div>
                </Show>
              </div>

              <Show when={item.pb !== undefined}>
                <div class="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-sub-alt opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 shadow-lg border border-sub/10">
                  <div class="text-[10px] font-bold tracking-widest text-sub uppercase mb-1">
                    {item.mode2} {props.mode === "time" ? "soniya" : "so'z"}
                  </div>
                  <div class="text-sm font-bold text-text">
                    {format().typingSpeed(item.pb?.wpm)} wpm
                  </div>
                  <div class="text-xs text-sub">{format().typingSpeed(item.pb?.raw)} raw</div>
                  <div class="text-xs text-sub">{format().accuracy(item.pb?.acc)} acc</div>
                  <div class="text-xs text-sub">{format().percentage(item.pb?.consistency)} con</div>
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
        <div class="flex flex-col border-l border-sub/5 bg-sub-alt/20 hover:bg-sub-alt/60 transition-colors">
          <Button
            balloon={{ text: "Barcha shaxsiy rekordlar", position: "left" }}
            class="h-full w-full rounded-none flex items-center justify-center text-sub hover:text-main"
            fa={{ icon: "fa-ellipsis-v" }}
            onClick={() => PbTablesModal.show(props.mode)}
          />
        </div>
      </Show>
    </div>
  );
}

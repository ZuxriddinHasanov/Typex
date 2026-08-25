// oxlint-disable react/no-unescaped-entities, solid/prefer-show, typescript/no-explicit-any, typescript/strict-boolean-expressions, curly, dot-notation, no-unnecessary-type-assertion, typescript/no-unsafe-assignment, typescript/no-unsafe-member-access, typescript/no-unsafe-call, typescript/no-unsafe-return, typescript/no-unsafe-argument
import { createQuery } from "@tanstack/solid-query";
import { JSXElement, For, Show } from "solid-js";

import Ape from "../../../ape";
import { cn } from "../../../utils/cn";
import { Fa } from "../../common/Fa";
import { AdminLayout } from "./AdminLayout";

function StatCard(props: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}): JSXElement {
  return (
    <div class="group from-bg-alt/90 relative overflow-hidden rounded-3xl border border-sub/5 bg-gradient-to-br to-bg/50 p-6 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-main/30 hover:shadow-2xl hover:shadow-main/10">
      <div
        class={cn(
          "absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40",
          props.color.replace("bg-", "bg-"),
        )}
      ></div>
      <div class="relative z-10 flex items-center justify-between">
        <div class="flex flex-col">
          <div class="text-sm font-semibold tracking-wider text-sub uppercase">
            {props.label}
          </div>
          <div class="mt-2 flex items-baseline gap-2">
            <div class="text-4xl font-black tracking-tight text-text">
              {props.value}
            </div>
          </div>
        </div>
        <div
          class={cn(
            "grid h-14 w-14 place-items-center rounded-2xl shadow-inner transition-transform group-hover:scale-110",
            props.color,
          )}
        >
          <Fa icon={props.icon as any} class="text-xl text-bg opacity-90" />
        </div>
      </div>
    </div>
  );
}

import { LineChart } from "../../common/LineChart";

export function AdminDashboardPage(): JSXElement {
  const analyticsQuery = createQuery(() => ({
    queryKey: ["admin", "analytics"],
    queryFn: async () => {
      const res = await Ape.admin.getAnalytics();
      return res.status === 200 ? (res.body.data as any) : null;
    },
    refetchInterval: 30_000,
  }));

  const signupsQuery = createQuery(() => ({
    queryKey: ["admin", "signups"],
    queryFn: async () => {
      const res = await Ape.admin.getSignupsByDay();
      return res.status === 200 ? (res.body.data as any) : [];
    },
  }));

  const dauQuery = createQuery(() => ({
    queryKey: ["admin", "dau"],
    queryFn: async () => {
      const res = await Ape.admin.getDau();
      return res.status === 200 ? (res.body.data as any) : [];
    },
  }));

  const retentionQuery = createQuery(() => ({
    queryKey: ["admin", "retention"],
    queryFn: async () => {
      const res = await Ape.admin.getRetention();
      return res.status === 200 ? (res.body.data as any) : null;
    },
  }));

  const topUsersQuery = createQuery(() => ({
    queryKey: ["admin", "topUsers"],
    queryFn: async () => {
      const res = await Ape.admin.getTopUsers();
      return res.status === 200 ? (res.body.data as any[]) : [];
    },
  }));

  const activityQuery = createQuery(() => ({
    queryKey: ["admin", "activity"],
    queryFn: async () => {
      const res = await Ape.admin.getActivity();
      if (res.status === 200 && (res.body.data as any)?.data)
        return (res.body.data as any).data as any[];
      return [];
    },
  }));

  return (
    <AdminLayout active="dashboard" title="Dashboard">
      {/* Overview Banner */}
      <div class="relative mb-8 overflow-hidden rounded-3xl border border-sub/5 bg-gradient-to-r from-main/10 via-bg to-bg p-8">
        <div class="absolute top-0 -right-20 opacity-10 blur-2xl">
          <Fa icon={"fa-chart-line" as any} class="text-[200px] text-main" />
        </div>
        <div class="relative z-10">
          <h2 class="mb-2 text-3xl font-black text-text">Umumiy statistika</h2>
          <p class="max-w-2xl text-sm leading-relaxed text-sub">
            Tizimning umumiy holati, foydalanuvchilar o'sishi va testlar
            o'zgarishi haqida to'liq va aniq real vaqt (real-time) tahlili.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div class="mb-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Foydalanuvchilar"
          value={(analyticsQuery.data as any)?.totalUsers ?? "..."}
          icon="fa-users"
          color="bg-blue-600"
        />
        <StatCard
          label="Testlar"
          value={(analyticsQuery.data as any)?.totalTestsCompleted ?? "..."}
          icon="fa-keyboard"
          color="bg-green-600"
        />
        <StatCard
          label="Boshlangan"
          value={(analyticsQuery.data as any)?.totalTestsStarted ?? "..."}
          icon="fa-play"
          color="bg-purple-600"
        />
        <StatCard
          label="Soat"
          value={
            analyticsQuery.data
              ? Math.round((analyticsQuery.data as any).totalTimeTyping / 3600)
              : "..."
          }
          icon="fa-clock"
          color="bg-orange-600"
        />
        <StatCard
          label="24h faol"
          value={(analyticsQuery.data as any)?.activeUsersLast24h ?? "..."}
          icon="fa-bolt"
          color="bg-rose-600"
        />
      </div>

      {/* Retention */}
      <div class="mt-6">
        <Show when={retentionQuery.data}>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5 text-center">
              <div class="text-3xl font-bold text-main">
                {(retentionQuery.data as any)?.day1 ?? 0}%
              </div>
              <div class="mt-1 text-xs text-sub">1-kun qaytish</div>
            </div>
            <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5 text-center">
              <div class="text-3xl font-bold text-main">
                {(retentionQuery.data as any)?.day7 ?? 0}%
              </div>
              <div class="mt-1 text-xs text-sub">7-kun qaytish</div>
            </div>
            <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5 text-center">
              <div class="text-3xl font-bold text-main">
                {(retentionQuery.data as any)?.day30 ?? 0}%
              </div>
              <div class="mt-1 text-xs text-sub">30-kun qaytish</div>
            </div>
          </div>
        </Show>
      </div>

      {/* Charts */}
      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">
            Ro'yxatdan o'tishlar (30 kun)
          </h2>
          <LineChart
            data={signupsQuery.data ?? []}
            labelKey="date"
            valueKey="count"
            color="var(--main-color)"
          />
        </div>
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">
            Kunlik faol foydalanuvchilar (30 kun)
          </h2>
          <LineChart
            data={dauQuery.data ?? []}
            labelKey="date"
            valueKey="count"
            color="var(--main-color)"
          />
        </div>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Activity */}
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">So'nggi faollik</h2>
          <Show
            when={(activityQuery.data ?? []).length > 0}
            fallback={<p class="text-sm text-sub">Ma'lumot yo'q</p>}
          >
            <div class="max-h-64 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
              <For each={activityQuery.data}>
                {(p: any) => (
                  <div class="flex items-center justify-between rounded-lg bg-sub-alt/30 px-4 py-2 text-xs">
                    <span class="text-text font-medium">{p.date}</span>
                    <span class="text-sub font-semibold">
                      <i class="fas fa-keyboard text-main mr-1"></i> {p.tests} test <span class="mx-1">•</span> <i class="fas fa-users text-main mr-1"></i> {p.users}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Top Users */}
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">Eng faol foydalanuvchilar (Top 20)</h2>
          <Show
            when={(topUsersQuery.data ?? []).length > 0}
            fallback={<p class="text-sm text-sub">Ma'lumot yo'q</p>}
          >
            <div class="max-h-64 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
              <For each={topUsersQuery.data}>
                {(u: any, i) => (
                  <a
                    href={`/typeuz-hq/users/${u.uid}`}
                    class="flex items-center justify-between rounded-lg bg-sub-alt/30 px-4 py-2 text-xs transition-colors hover:bg-sub-alt/50 cursor-pointer"
                  >
                    <div class="flex items-center gap-3">
                      <div class="font-black text-main w-5 text-right">#{i() + 1}</div>
                      <div class="grid h-6 w-6 place-items-center rounded-full bg-main/20 font-bold text-main">
                        {(u.name ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <span class="text-text font-bold">{u.name}</span>
                    </div>
                    <div class="flex items-center gap-3 font-semibold">
                      <span class="text-sub" title="Yakunlangan testlar soni"><i class="fas fa-check-circle mr-1 text-green-500"></i>{u.tests}</span>
                      <span class="text-main bg-main/10 px-2 py-0.5 rounded-md">{Math.round(u.wpm)} WPM</span>
                    </div>
                  </a>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </AdminLayout>
  );
}

// oxlint-disable react/no-unescaped-entities, solid/prefer-show, typescript/no-explicit-any, typescript/strict-boolean-expressions, curly, dot-notation, no-unnecessary-type-assertion, typescript/no-unsafe-assignment, typescript/no-unsafe-member-access, typescript/no-unsafe-call, typescript/no-unsafe-return, typescript/no-unsafe-argument, eslint/no-unused-vars
import { createQuery } from "@tanstack/solid-query";
import { JSXElement, Show, For } from "solid-js";

import Ape from "../../../ape";
import { AdminLayout } from "./AdminLayout";
import { LineChart } from "../../common/LineChart";

export function AdminAnalyticsPage(): JSXElement {
  const signupsQuery = createQuery(() => ({
    queryKey: ["admin", "signups"],
    queryFn: async () => {
      const r = await Ape.admin.getSignupsByDay();
      return r.status === 200 ? ((r.body.data as any) ?? []) : [];
    },
  }));
  const loginsQuery = createQuery(() => ({
    queryKey: ["admin", "loginsDay"],
    queryFn: async () => {
      const r = await Ape.admin.getLoginsByDay();
      return r.status === 200 ? ((r.body.data as any) ?? []) : [];
    },
  }));
  const dauQuery = createQuery(() => ({
    queryKey: ["admin", "dau"],
    queryFn: async () => {
      const r = await Ape.admin.getDau();
      return r.status === 200 ? ((r.body.data as any) ?? []) : [];
    },
  }));
  const retentionQuery = createQuery(() => ({
    queryKey: ["admin", "retention"],
    queryFn: async () => {
      const r = await Ape.admin.getRetention();
      return r.status === 200 ? (r.body.data as any) : null;
    },
  }));
  const wpmQuery = createQuery(() => ({
    queryKey: ["admin", "wpm"],
    queryFn: async () => {
      const r = await Ape.admin.getWpmDistribution();
      return r.status === 200 ? ((r.body.data as any) ?? []) : [];
    },
  }));
  const topUsersQuery = createQuery(() => ({
    queryKey: ["admin", "topUsers"],
    queryFn: async () => {
      const r = await Ape.admin.getTopUsers();
      return r.status === 200 ? ((r.body.data as any) ?? []) : [];
    },
  }));
  const growthQuery = createQuery(() => ({
    queryKey: ["admin", "growth"],
    queryFn: async () => {
      const r = await Ape.admin.getUserGrowth();
      return r.status === 200 ? ((r.body.data as any) ?? []) : [];
    },
  }));

  return (
    <AdminLayout active="analytics" title="Analitika">
      {/* Retention */}
      <div class="mb-6">
        <Show when={retentionQuery.data}>
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5 text-center">
              <div class="text-green-400 text-3xl font-bold">
                {(retentionQuery.data as any)?.day1 ?? 0}%
              </div>
              <div class="mt-1 text-xs text-sub">1-kun</div>
            </div>
            <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5 text-center">
              <div class="text-yellow-400 text-3xl font-bold">
                {(retentionQuery.data as any)?.day7 ?? 0}%
              </div>
              <div class="mt-1 text-xs text-sub">7-kun</div>
            </div>
            <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5 text-center">
              <div class="text-rose-400 text-3xl font-bold">
                {(retentionQuery.data as any)?.day30 ?? 0}%
              </div>
              <div class="mt-1 text-xs text-sub">30-kun</div>
            </div>
          </div>
        </Show>
      </div>

      {/* Charts */}
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">Ro'yxatdan o'tishlar</h2>
          <LineChart
            data={signupsQuery.data}
            labelKey="date"
            valueKey="count"
            color="#22c55e"
          />
        </div>
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">Kirishlar</h2>
          <LineChart
            data={loginsQuery.data}
            labelKey="date"
            valueKey="count"
            color="#3b82f6"
          />
        </div>
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">DAU (kunlik faol)</h2>
          <LineChart
            data={dauQuery.data}
            labelKey="date"
            valueKey="count"
            color="#a855f7"
          />
        </div>
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">
            Foydalanuvchi o'sishi
          </h2>
          <LineChart
            data={growthQuery.data}
            labelKey="date"
            valueKey="newUsers"
            color="#f59e0b"
          />
        </div>
      </div>

      {/* WPM Distribution */}
      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">WPM taqsimoti</h2>
          <Show
            when={wpmQuery.data?.length > 0}
            fallback={<p class="text-xs text-sub">Ma'lumot yo'q</p>}
          >
            <div class="space-y-2">
              <For each={wpmQuery.data}>
                {(b: any) => (
                  <div class="flex items-center gap-3">
                    <span class="w-12 text-xs text-sub">{b.range}</span>
                    <div class="h-5 flex-1 rounded-full bg-sub-alt">
                      <div
                        class="h-full rounded-full bg-main transition-all"
                        style={{ width: `${Math.min(100, b.count)}%` }}
                      ></div>
                    </div>
                    <span class="w-8 text-right text-xs text-text">
                      {b.count}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">
            Top 20 foydalanuvchilar
          </h2>
          <Show
            when={topUsersQuery.data?.length > 0}
            fallback={<p class="text-xs text-sub">Ma'lumot yo'q</p>}
          >
            <div class="max-h-80 space-y-1 overflow-y-auto">
              <For each={topUsersQuery.data}>
                {(u: any, i) => (
                  <div class="flex items-center justify-between rounded-lg bg-sub-alt/30 px-3 py-2 text-xs">
                    <div class="flex items-center gap-3">
                      <span class="w-5 font-bold text-main">{i() + 1}</span>
                      <span class="text-text">{u.name}</span>
                    </div>
                    <div class="flex items-center gap-4">
                      <span class="text-sub">{u.wpm} WPM</span>
                      <span class="text-sub/60">{u.tests} test</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </AdminLayout>
  );
}

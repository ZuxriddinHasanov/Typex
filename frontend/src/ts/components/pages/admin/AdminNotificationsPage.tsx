// oxlint-disable react/no-unescaped-entities, solid/prefer-show, typescript/no-explicit-any, typescript/strict-boolean-expressions, curly, dot-notation, no-unnecessary-type-assertion, typescript/no-unsafe-assignment, typescript/no-unsafe-member-access, typescript/no-unsafe-call, typescript/no-unsafe-return, typescript/no-unsafe-argument
import { createForm } from "@tanstack/solid-form";
import { createQuery } from "@tanstack/solid-query";
import { JSXElement, Show, createSignal, For, createEffect } from "solid-js";

import Ape from "../../../ape";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../../states/notifications";
import { Fa } from "../../common/Fa";
import { AdminLayout } from "./AdminLayout";

export function AdminNotificationsPage(): JSXElement {
  const [sendAll, setSendAll] = createSignal(false);
  const [result, setResult] = createSignal("");
  const [history, setHistory] = createSignal<any[]>([]);

  const notifQuery = createQuery(() => ({
    queryKey: ["admin", "notifications"],
    queryFn: async () => {
      const r = await Ape.admin.getNotifications();
      return r.status === 200 ? ((r.body.data as any) ?? []) : [];
    },
  }));

  createEffect(() => {
    const d = notifQuery.data;
    if (d !== undefined && Array.isArray(d)) setHistory(d);
  });

  const form = createForm(() => ({
    defaultValues: { uid: "", subject: "", body: "" },
    onSubmit: async ({ value }) => {
      try {
        const uid = sendAll() ? "*" : value.uid;
        await Ape.admin.sendNotification({
          body: { uid, subject: value.subject, body: value.body },
        });
        setResult(sendAll() ? "Barchaga yuborildi" : "Yuborildi");
        showSuccessNotification("Bildirishnoma yuborildi");
        void notifQuery.refetch();
      } catch {
        showErrorNotification("Xatolik");
      }
    },
  }));

  return (
    <AdminLayout active="notifications" title="Bildirishnomalar">
      <div class="grid gap-6 lg:grid-cols-2">
        {/* Send form */}
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">Yangi bildirishnoma</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit();
            }}
            class="flex flex-col gap-3"
          >
            <div class="flex gap-2 p-1 rounded-xl bg-bg/50 border border-sub/10">
              <button
                type="button"
                class={"flex-1 rounded-lg py-2 text-xs font-medium transition-colors " + (!sendAll() ? "bg-main text-bg" : "text-sub hover:text-text")}
                onClick={() => setSendAll(false)}
              >
                <Fa icon="fa-user" class="mr-2" />
                Shaxsiy xabar
              </button>
              <button
                type="button"
                class={"flex-1 rounded-lg py-2 text-xs font-medium transition-colors " + (sendAll() ? "bg-main text-bg" : "text-sub hover:text-text")}
                onClick={() => setSendAll(true)}
              >
                <Fa icon="fa-bullhorn" class="mr-2" />
                Umumiy e'lon
              </button>
            </div>
            <Show
              when={!sendAll()}
              fallback={
                <div class="rounded-lg bg-main/10 p-3 text-xs text-sub">
                  Barcha foydalanuvchilarga xabar ketadi
                </div>
              }
            >
              <form.Field name="uid">
                {(f) => (
                  <input
                    value={f().state.value}
                    onInput={(e) => f().handleChange(e.currentTarget.value)}
                    placeholder="Foydalanuvchi UID"
                    class="w-full rounded-xl bg-sub-alt p-3 text-sm text-text ring-1 ring-sub/20 outline-none focus:ring-main"
                  />
                )}
              </form.Field>
            </Show>
            <form.Field name="subject">
              {(f) => (
                <input
                  value={f().state.value}
                  onInput={(e) => f().handleChange(e.currentTarget.value)}
                  placeholder="Mavzu"
                  class="w-full rounded-xl bg-sub-alt p-3 text-sm text-text ring-1 ring-sub/20 outline-none focus:ring-main"
                />
              )}
            </form.Field>
            <form.Field name="body">
              {(f) => (
                <textarea
                  value={f().state.value}
                  onInput={(e) => f().handleChange(e.currentTarget.value)}
                  placeholder="Matn"
                  rows={4}
                  class="w-full resize-none rounded-xl bg-sub-alt p-3 text-sm text-text ring-1 ring-sub/20 outline-none focus:ring-main"
                ></textarea>
              )}
            </form.Field>
            <button
              type="submit"
              class="rounded-xl bg-main px-4 py-2.5 text-sm font-medium text-bg hover:opacity-90"
            >
              {sendAll() ? "Barchaga yuborish" : "Yuborish"}
            </button>
            <Show when={result()}>
              <p class="text-xs text-sub">{result()}</p>
            </Show>
          </form>
        </div>

        {/* History */}
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-sm font-bold text-text">Tarix</h2>
            <button
              type="button"
              onClick={() => void notifQuery.refetch()}
              class="rounded-lg bg-sub-alt px-3 py-1.5 text-xs text-sub hover:text-text"
            >
              <Fa icon="fa-sync" class="mr-1" />
              Yangilash
            </button>
          </div>
          <Show
            when={history().length > 0}
            fallback={
              <p class="text-xs text-sub">Hali bildirishnomalar yo'q</p>
            }
          >
            <div class="max-h-96 space-y-2 overflow-y-auto">
              <For each={history()}>
                {(n: any) => (
                  <div class="rounded-lg bg-sub-alt/30 p-3 text-xs">
                    <div class="flex items-center justify-between">
                      <span class="font-medium text-text">{n.subject}</span>
                      <span class="text-sub/50">
                        {new Date(n.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p class="mt-1 text-sub">
                      {n.body?.slice(0, 150) ?? ""}
                      {n.body?.length > 150 ? "..." : ""}
                    </p>
                    <div class="mt-1 text-sub/40">
                      UID: {(n.uid ?? "").slice(0, 12)}...
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

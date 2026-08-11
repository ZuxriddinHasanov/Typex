// oxlint-disable react/no-unescaped-entities, solid/prefer-show, typescript/no-explicit-any, typescript/strict-boolean-expressions, curly, dot-notation, no-unnecessary-type-assertion, typescript/no-unsafe-assignment, typescript/no-unsafe-member-access, typescript/no-unsafe-call, typescript/no-unsafe-return, typescript/no-unsafe-argument, react/button-has-type
import { createForm } from "@tanstack/solid-form";
import { createMutation } from "@tanstack/solid-query";
import { JSXElement, Show, createSignal, For, onMount } from "solid-js";

import Ape from "../../../ape";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../../states/notifications";
import { cn } from "../../../utils/cn";
import { Fa } from "../../common/Fa";
import { AdminLayout } from "./AdminLayout";

export function AdminUsersPage(): JSXElement {
  const [users, setUsers] = createSignal<any[]>([]);
  const [total, setTotal] = createSignal(0);
  const [skip, setSkip] = createSignal(0);
  const [searchQ, setSearchQ] = createSignal("");
  const [searchResults, setSearchResults] = createSignal<any[]>([]);
  const [selectedUser, setSelectedUser] = createSignal<any | null>(null);
  const [banResult, setBanResult] = createSignal("");

  const loadUsers = async (s: number) => {
    try {
      const res = await Ape.admin.listUsers({ query: { skip: s, limit: 25 } });
      if (res.status === 200) {
        const d = res.body.data as any;
        setUsers(d?.users ?? []);
        setTotal(d?.total ?? 0);
        setSkip(s);
      }
    } catch {
      /* ignore */
    }
  };

  onMount(() => {
    void loadUsers(0);
  });

  const searchUsers = async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await Ape.admin.searchUsers({ query: { q } });
      if (res.status === 200) setSearchResults((res.body.data as any) ?? []);
    } catch {
      /* ignore */
    }
  };

  const banMutation = createMutation(() => ({
    mutationFn: async (uid: string) => Ape.admin.toggleBan({ body: { uid } }),
    onSuccess: (res: any) => {
      const d = res?.body?.data as any;
      setBanResult(d?.banned ? "Bloklandi" : "Blokdan ochildi");
      showSuccessNotification("Holat o'zgartirildi");
      void loadUsers(skip());
    },
    onError: () => showErrorNotification("Xatolik"),
  }));

  const banForm = createForm(() => ({
    defaultValues: { uid: "" },
    onSubmit: ({ value }) => {
      banMutation.mutate(value.uid);
    },
  }));

  return (
    <AdminLayout active="users" title="Foydalanuvchilar">
      {/* Search */}
      <div class="group relative mb-8 flex gap-4">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-sub transition-colors group-focus-within:text-main">
          <Fa icon="fa-search" class="text-lg" />
        </div>
        <input
          value={searchQ()}
          onInput={(e) => {
            setSearchQ(e.currentTarget.value);
            void searchUsers(e.currentTarget.value);
          }}
          placeholder="Ism, email yoki UID bo'yicha qidirish..."
          class="flex-1 rounded-2xl bg-bg/50 py-4 pr-6 pl-12 text-base font-medium text-text shadow-inner ring-1 ring-sub/10 backdrop-blur-xl transition-all outline-none focus:bg-bg/80 focus:ring-2 focus:ring-main"
        />
        <button class="rounded-2xl bg-main px-6 py-4 text-sm font-black tracking-widest text-bg uppercase shadow-lg shadow-main/30 transition-transform hover:scale-105">
          Qidirish
        </button>
      </div>

      <Show when={searchResults().length > 0}>
        <div class="mb-6 rounded-2xl border border-sub/10 bg-bg/60 p-4">
          <h3 class="mb-3 text-sm font-bold text-text">Qidiruv natijalari</h3>
          <div class="max-h-48 space-y-1 overflow-y-auto">
            <For each={searchResults()}>
              {(u: any) => (
                <div class="flex items-center justify-between rounded-lg bg-sub-alt/30 px-4 py-2 text-xs">
                  <div class="flex items-center gap-3">
                    <div class="grid h-8 w-8 place-items-center rounded-full bg-main/20 text-xs font-bold text-main">
                      {(u.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span class="font-medium text-text">{u.name}</span>
                      <span class="ml-2 text-sub">{u.email}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class={cn(
                        "rounded-full px-2 py-0.5 text-[10px]",
                        u.banned
                          ? "bg-error/20 text-error"
                          : "bg-green-500/20 text-green-400",
                      )}
                    >
                      {u.banned ? "Bloklangan" : "Faol"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(u)}
                      class="rounded-lg bg-main/20 px-2 py-1 text-[10px] text-main hover:bg-main hover:text-bg"
                    >
                      Batafsil
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Table */}
      <div class="overflow-hidden rounded-3xl border border-sub/10 bg-bg/80 shadow-2xl backdrop-blur-xl">
        <div class="bg-bg-alt/50 flex items-center justify-between border-b border-sub/10 p-4">
          <h3 class="text-sm font-black tracking-widest text-text uppercase">
            Foydalanuvchilar ({total()})
          </h3>
          <div class="flex gap-2">
            <button class="rounded-lg bg-main/20 px-4 py-2 text-xs font-bold text-main transition-all hover:bg-main hover:text-bg">
              Export (CSV)
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr class="border-b border-sub/10 bg-sub-alt/20 text-[11px] font-bold tracking-wider text-sub/80 uppercase">
                <th class="p-4 pl-6 font-semibold">Foydalanuvchi</th>
                <th class="p-4 font-semibold">Email</th>
                <th class="p-4 font-semibold">Holat</th>
                <th class="p-4 font-semibold">Testlar & Vaqt</th>
                <th class="p-4 font-semibold">WPM & Streak</th>
                <th class="p-4 font-semibold">So'nggi kirish</th>
                <th class="p-4 pr-6 text-right font-semibold">Amallar</th>
              </tr>
            </thead>
            <tbody>
              <For each={users()}>
                {(u: any, _i) => (
                  <tr class="group border-b border-sub/5 text-text transition-all hover:bg-sub-alt/20">
                    <td class="p-4 pl-6">
                      <div class="flex items-center gap-4">
                        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-main/30 to-main/5 text-sm font-black text-main shadow-sm ring-1 ring-main/20 transition-transform group-hover:scale-110">
                          {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div class="flex flex-col">
                          <span class="font-bold text-text">
                            {u.name ?? "N/A"}
                          </span>
                          <span class="mt-0.5 font-mono text-[10px] text-sub/60">
                            {u.uid}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td class="p-4 font-medium text-sub">{u.email ?? "—"}</td>
                    <td class="p-4">
                      <span
                        class={cn(
                          "flex w-fit items-center gap-1.5 rounded-xl px-3 py-1 text-[11px] font-bold tracking-wide",
                          u.banned
                            ? "bg-error/15 text-error ring-1 ring-error/30"
                            : "bg-green-500/15 text-green-400 ring-green-500/30 ring-1",
                        )}
                      >
                        <div
                          class={cn(
                            "h-1.5 w-1.5 rounded-full",
                            u.banned ? "bg-error" : "bg-green-400",
                          )}
                        ></div>
                        {u.banned ? "BLOKLANGAN" : "FAOL"}
                      </span>
                    </td>
                    <td class="p-4">
                      <div class="flex flex-col">
                        <span class="font-bold text-text">
                          {u.completedTests ?? 0}
                        </span>
                        <span class="text-xs text-sub">
                          {Math.round((u.timeTyping ?? 0) / 60)} min
                        </span>
                      </div>
                    </td>
                    <td class="p-4">
                      <div class="flex flex-col">
                        <span class="font-bold text-main">
                          {(u as any).pbs
                            ? (Object.values(
                                (u as any).pbs as Record<string, any>,
                              )?.[0]?.wpm ?? "—")
                            : "—"}
                        </span>
                        <span class="text-xs text-sub">
                          <i class="fas fa-fire text-orange-500"></i> {u.streak ?? 0} k
                        </span>
                      </div>
                    </td>
                    <td class="p-4">
                      <div class="flex flex-col">
                        <span class="font-medium text-text">
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleDateString("uz-UZ", {
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </span>
                        <span class="text-[10px] text-sub">
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleTimeString("uz-UZ", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </div>
                    </td>
                    <td class="p-4 pr-6">
                      <div class="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(u)}
                          title="Batafsil ko'rish"
                          class="grid h-8 w-8 place-items-center rounded-lg bg-main/10 text-main transition-colors hover:bg-main hover:text-bg"
                        >
                          <Fa icon="fa-eye" class="text-sm" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await Ape.admin.toggleBan({ body: { uid: u.uid } });
                            void loadUsers(skip());
                          }}
                          title={u.banned ? "Blokdan ochish" : "Bloklash"}
                          class="grid h-8 w-8 place-items-center rounded-lg bg-error/10 text-error transition-colors hover:bg-error hover:text-bg"
                        >
                          <Fa
                            icon={u.banned ? "fa-unlock" : "fa-lock"}
                            class="text-sm"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              !confirm(
                                "Rostdan ham bu foydalanuvchini butunlay o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi!",
                              )
                            )
                              return;
                            const res = await Ape.admin.deleteUser({
                              body: { uid: u.uid },
                            });
                            if (res.status === 200) {
                              showSuccessNotification(
                                "Foydalanuvchi o'chirildi",
                              );
                              void loadUsers(skip());
                            } else {
                              showErrorNotification(
                                "O'chirishda xatolik yuz berdi",
                              );
                            }
                          }}
                          title="O'chirish"
                          class="grid h-8 w-8 place-items-center rounded-lg bg-error/10 text-error transition-colors hover:bg-error hover:text-bg"
                        >
                          <Fa icon="fa-trash-alt" class="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div class="flex items-center justify-between border-t border-sub/10 px-4 py-3">
          <button
            disabled={skip() === 0}
            onClick={() => void loadUsers(Math.max(0, skip() - 25))}
            class="rounded-lg bg-sub-alt px-3 py-1.5 text-xs text-sub hover:text-text disabled:opacity-40"
          >
            Oldingi
          </button>
          <span class="text-xs text-sub">
            {skip() + 1}–{Math.min(skip() + 25, total())} / {total()}
          </span>
          <button
            disabled={skip() + 25 >= total()}
            onClick={() => void loadUsers(skip() + 25)}
            class="rounded-lg bg-sub-alt px-3 py-1.5 text-xs text-sub hover:text-text disabled:opacity-40"
          >
            Keyingi
          </button>
        </div>
      </div>

      {/* Admin Actions */}
      <div class="mt-8 grid gap-8 lg:grid-cols-2">
        <div class="group relative overflow-hidden rounded-3xl border border-sub/10 bg-bg/80 p-8 shadow-xl backdrop-blur-xl">
          <div class="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-error/5 blur-3xl transition-colors group-hover:bg-error/10"></div>
          <div class="relative z-10 mb-6 flex items-center gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-xl bg-error/10 text-error">
              <Fa icon="fa-gavel" class="text-lg" />
            </div>
            <div>
              <h2 class="text-lg font-black tracking-tight text-text">
                Manual nazorat (UID)
              </h2>
              <p class="mt-0.5 text-[11px] font-semibold tracking-widest text-sub/70 uppercase">
                Tezkor bloklash/ochish
              </p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void banForm.handleSubmit();
            }}
            class="relative z-10 flex gap-4"
          >
            <banForm.Field name="uid">
              {(f) => (
                <input
                  value={f().state.value}
                  onInput={(e) => f().handleChange(e.currentTarget.value)}
                  placeholder="Foydalanuvchi identifikatori (UID)"
                  class="bg-bg-alt/50 flex-1 rounded-2xl px-6 py-4 font-mono text-sm text-text shadow-inner ring-1 ring-sub/10 transition-all outline-none focus:ring-2 focus:ring-error"
                />
              )}
            </banForm.Field>
            <button
              type="submit"
              class="rounded-2xl bg-error px-6 py-4 text-sm font-black tracking-widest text-bg uppercase shadow-lg shadow-error/30 transition-transform hover:scale-105"
            >
              Amal qilish
            </button>
          </form>
          <Show when={banResult()}>
            <p class="mt-2 text-xs text-sub">{banResult()}</p>
          </Show>
        </div>

        <div class="group relative overflow-hidden rounded-3xl border border-sub/10 bg-bg/80 p-8 shadow-xl backdrop-blur-xl">
          <div class="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-main/5 blur-3xl transition-colors group-hover:bg-main/10"></div>
          <div class="relative z-10 mb-6 flex items-center gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-xl bg-main/10 text-main">
              <Fa icon="fa-key" class="text-lg" />
            </div>
            <div>
              <h2 class="text-lg font-black tracking-tight text-text">
                Parolni tiklash
              </h2>
              <p class="mt-0.5 text-[11px] font-semibold tracking-widest text-sub/70 uppercase">
                Email orqali so'rov yuborish
              </p>
            </div>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              try {
                await Ape.admin.sendForgotPasswordEmail({
                  body: { email: fd.get("email") as string },
                });
                showSuccessNotification("Email yuborildi");
              } catch {
                showErrorNotification("Xatolik");
              }
            }}
            class="relative z-10 flex gap-4"
          >
            <input
              name="email"
              type="email"
              placeholder="Foydalanuvchi emaili"
              required
              class="bg-bg-alt/50 flex-1 rounded-2xl px-6 py-4 text-sm text-text shadow-inner ring-1 ring-sub/10 transition-all outline-none focus:ring-2 focus:ring-main"
            />
            <button
              type="submit"
              class="rounded-2xl bg-main px-6 py-4 text-sm font-black tracking-widest text-bg uppercase shadow-lg shadow-main/30 transition-transform hover:scale-105"
            >
              Yuborish
            </button>
          </form>
        </div>
      </div>

      {/* User detail modal */}
      <Show when={selectedUser() !== null}>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-md transition-all"
          onClick={() => setSelectedUser(null)}
        >
          <div
            class="animate-in fade-in zoom-in-95 mx-4 w-full max-w-xl overflow-hidden rounded-[2rem] border border-sub/10 bg-bg shadow-2xl duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="from-bg-alt border-b border-sub/10 bg-gradient-to-r to-bg p-8">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-5">
                  <div class="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-main/30 to-main/5 text-2xl font-black text-main shadow-lg ring-1 ring-main/20">
                    {selectedUser()?.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>
                  <div>
                    <h3 class="flex items-center gap-2 text-2xl font-black tracking-tight text-text">
                      {selectedUser()?.name ?? "N/A"}
                      <Show when={selectedUser()?.banned}>
                        <span class="rounded-full bg-error px-2 py-0.5 text-[9px] font-bold tracking-widest text-bg uppercase">
                          Bloklangan
                        </span>
                      </Show>
                    </h3>
                    <p class="mt-1 text-sm font-medium text-sub">
                      {selectedUser()?.email ?? "—"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  class="grid h-10 w-10 place-items-center rounded-full bg-sub-alt/50 text-sub transition-colors hover:bg-error hover:text-bg"
                >
                  <Fa icon="fa-times" />
                </button>
              </div>
            </div>

            <div class="p-8">
              <div class="grid grid-cols-2 gap-6 text-sm md:grid-cols-3">
                <div class="rounded-2xl border border-sub/10 bg-bg-alt/50 p-5 transition-colors hover:border-main/30 hover:bg-main/5">
                  <span class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-sub uppercase">
                    <Fa icon="fa-id-card" /> UID
                  </span>
                  <p class="mt-2 text-xs font-mono font-semibold text-text truncate" title={selectedUser()?.uid ?? ""}>
                    {selectedUser()?.uid ?? "—"}
                  </p>
                </div>
                <div class="rounded-2xl border border-sub/10 bg-bg-alt/50 p-5 transition-colors hover:border-main/30 hover:bg-main/5">
                  <span class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-sub uppercase">
                    <Fa icon="fa-calendar-alt" /> Ro'yxatdan o'tgan
                  </span>
                  <p class="mt-2 text-sm font-semibold text-text">
                    {selectedUser()?.addedAt
                      ? new Date(selectedUser().addedAt).toLocaleDateString(
                          "uz-UZ",
                          { year: "numeric", month: "long", day: "numeric" },
                        )
                      : "—"}
                  </p>
                </div>
                <div class="rounded-2xl border border-sub/10 bg-bg-alt/50 p-5 transition-colors hover:border-main/30 hover:bg-main/5">
                  <span class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-sub uppercase">
                    <Fa icon="fa-sign-in-alt" /> So'nggi faollik
                  </span>
                  <p class="mt-2 text-sm font-semibold text-text">
                    {selectedUser()?.lastLoginAt
                      ? new Date(selectedUser().lastLoginAt).toLocaleString(
                          "uz-UZ",
                          { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
                        )
                      : "—"}
                  </p>
                </div>
                <div class="rounded-2xl border border-sub/10 bg-bg-alt/50 p-5 transition-colors hover:border-main/30 hover:bg-main/5">
                  <span class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-sub uppercase">
                    <Fa icon="fa-keyboard" /> Yakunlangan testlar
                  </span>
                  <p class="mt-2 text-3xl font-black text-text">
                    {selectedUser()?.completedTests ?? 0}
                  </p>
                </div>
                <div class="rounded-2xl border border-sub/10 bg-bg-alt/50 p-5 transition-colors hover:border-main/30 hover:bg-main/5">
                  <span class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-sub uppercase">
                    <Fa icon="fa-clock" /> Vaqt (yozishda)
                  </span>
                  <p class="mt-2 text-3xl font-black text-text">
                    {Math.round((selectedUser()?.timeTyping ?? 0) / 60)} <span class="text-lg text-sub">min</span>
                  </p>
                </div>
                <div class="rounded-2xl border border-sub/10 bg-bg-alt/50 p-5 transition-colors hover:border-main/30 hover:bg-main/5">
                  <span class="flex items-center gap-2 text-[10px] font-bold tracking-widest text-sub uppercase">
                    <Fa icon="fa-fire" class="text-orange-500" /> Streak (Davomiylik)
                  </span>
                  <p class="mt-2 text-3xl font-black text-text">
                    {selectedUser()?.streak ?? 0} <span class="text-lg text-sub">kun</span>
                  </p>
                </div>
              </div>

              <div class="mt-8 flex gap-4">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await Ape.admin.toggleBan({
                      body: { uid: selectedUser()?.uid },
                    });
                    if (res.status === 200) {
                      showSuccessNotification(
                        "Holat muvaffaqiyatli o'zgartirildi",
                      );
                      void loadUsers(skip());
                      setSelectedUser(null);
                    }
                  }}
                  class={cn(
                    "flex-1 rounded-2xl py-4 text-sm font-black tracking-widest uppercase transition-transform hover:scale-[1.02]",
                    selectedUser()?.banned
                      ? "bg-green-500 shadow-green-500/30 text-bg shadow-lg"
                      : "bg-error text-bg shadow-lg shadow-error/30",
                  )}
                >
                  <Fa
                    icon={selectedUser()?.banned ? "fa-unlock" : "fa-lock"}
                    class="mr-2"
                  />
                  {selectedUser()?.banned
                    ? "Blokdan ochish"
                    : "Tizimdan bloklash"}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      !confirm(
                        "Rostdan ham bu foydalanuvchini butunlay o'chirib tashlamoqchimisiz?",
                      )
                    )
                      return;
                    const res = await Ape.admin.deleteUser({
                      body: { uid: selectedUser()?.uid },
                    });
                    if (res.status === 200) {
                      showSuccessNotification(
                        "Foydalanuvchi muvaffaqiyatli o'chirildi",
                      );
                      void loadUsers(skip());
                      setSelectedUser(null);
                    } else {
                      showErrorNotification("Xatolik yuz berdi");
                    }
                  }}
                  class="flex-[0.5] rounded-2xl bg-error/10 font-black tracking-widest text-error uppercase transition-colors hover:bg-error hover:text-bg"
                >
                  <Fa icon="fa-trash-alt" class="mr-2" />
                  O'chirish
                </button>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </AdminLayout>
  );
}

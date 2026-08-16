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
    <AdminLayout
      active="users"
      title={
        selectedUser()
          ? `${selectedUser()?.name ?? "Foydalanuvchi"} — Tafsilotlar`
          : "Foydalanuvchilar"
      }
    >
      <Show
        when={selectedUser()}
        fallback={
          <>
            {/* Search */}
            <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div class="group relative w-full max-w-md">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sub transition-colors group-focus-within:text-main">
                  <Fa icon="fa-search" class="text-sm" />
                </div>
                <input
                  value={searchQ()}
                  onInput={(e) => {
                    setSearchQ(e.currentTarget.value);
                    void searchUsers(e.currentTarget.value);
                  }}
                  placeholder="Ism, email yoki UID bo'yicha qidirish..."
                  class="w-full rounded-xl bg-bg/60 py-2.5 pr-4 pl-9 text-xs font-medium text-text ring-1 ring-sub/10 backdrop-blur-md outline-none transition-all focus:bg-bg/90 focus:ring-2 focus:ring-main"
                />
              </div>
              <span class="text-xs font-bold text-sub">
                Jami: <span class="font-black text-text">{total()}</span> ta foydalanuvchi
              </span>
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
              <div class="flex items-center justify-between border-b border-sub/10 bg-bg-alt/50 p-4">
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
                        <tr
                          class="group border-b border-sub-alt/30 hover:bg-sub-alt/20 cursor-pointer"
                          onClick={() => {
                            setSelectedUser(u);
                          }}
                        >
                          <td class="p-4 pl-6">
                            <div class="flex items-center gap-4 hover:opacity-80">
                              <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-main/30 to-main/5 text-sm font-black text-main shadow-sm ring-1 ring-main/20 transition-transform group-hover:scale-110">
                                {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                              </div>
                              <div class="flex flex-col">
                                <span class="font-bold text-text hover:text-main">
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
                                  : "bg-green-500/15 text-green-400 ring-1 ring-green-500/30",
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
                                {(u as any).pbs &&
                                Object.values((u as any).pbs).length > 0
                                  ? `${(u as any).pbs.time_15 ?? Object.values((u as any).pbs)[0]} WPM`
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedUser(u);
                                }}
                                title="Batafsil ko'rish"
                                class="grid h-8 w-8 place-items-center rounded-lg bg-main/10 text-main transition-colors hover:bg-main hover:text-bg"
                              >
                                <Fa icon="fa-eye" class="text-sm" />
                              </button>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
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
                                onClick={async (e) => {
                                  e.stopPropagation();
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

            {/* Admin Quick Actions */}
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
                  class="relative z-10 flex gap-3"
                >
                  <banForm.Field name="uid">
                    {(field) => (
                      <input
                        name={field().name}
                        value={field().state.value}
                        onInput={(e) => field().handleChange(e.currentTarget.value)}
                        placeholder="Foydalanuvchi UID..."
                        class="flex-1 rounded-2xl bg-sub-alt/40 px-5 py-3.5 text-xs font-semibold text-text ring-1 ring-sub/10 outline-none transition-all placeholder:text-sub/50 focus:bg-sub-alt/80 focus:ring-2 focus:ring-main"
                      />
                    )}
                  </banForm.Field>
                  <button
                    type="submit"
                    disabled={banMutation.isPending}
                    class="rounded-2xl bg-error px-6 py-3.5 text-xs font-black tracking-wider text-bg shadow-lg shadow-error/25 uppercase transition-all hover:bg-error/90 active:scale-95 disabled:opacity-50"
                  >
                    O'zgartirish
                  </button>
                </form>
                <Show when={banResult()}>
                  <p class="mt-4 text-xs font-bold text-main">{banResult()}</p>
                </Show>
              </div>
            </div>
          </>
        }
      >
        {/* Dedicated Admin User Detail View */}
        <div class="animate-in fade-in flex flex-col gap-8 duration-300">
          <div class="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              class="inline-flex items-center gap-2.5 rounded-2xl border border-sub/10 bg-bg/80 px-5 py-2.5 text-xs font-bold text-main shadow-lg backdrop-blur-xl transition-all hover:bg-main hover:text-bg hover:scale-105"
            >
              <Fa icon="fa-arrow-left" />
              Barcha foydalanuvchilarga qaytish
            </button>
            <div class="flex items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  const res = await Ape.admin.toggleBan({
                    body: { uid: selectedUser()?.uid },
                  });
                  if (res.status === 200) {
                    const isBanned = !selectedUser()?.banned;
                    setSelectedUser({ ...selectedUser(), banned: isBanned });
                    showSuccessNotification(
                      isBanned
                        ? "Foydalanuvchi bloklandi"
                        : "Foydalanuvchi blokdan ochildi",
                    );
                    void loadUsers(skip());
                  }
                }}
                class={cn(
                  "rounded-2xl px-5 py-2.5 text-xs font-black tracking-wider uppercase transition-all shadow-md active:scale-95",
                  selectedUser()?.banned
                    ? "bg-green-500 text-bg hover:bg-green-600 shadow-green-500/20"
                    : "bg-error text-bg hover:bg-error/90 shadow-error/20",
                )}
              >
                <Fa
                  icon={selectedUser()?.banned ? "fa-unlock" : "fa-lock"}
                  class="mr-2"
                />
                {selectedUser()?.banned ? "Blokdan ochish" : "Bloklash"}
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
                    body: { uid: selectedUser()?.uid },
                  });
                  if (res.status === 200) {
                    showSuccessNotification("Foydalanuvchi o'chirildi");
                    setSelectedUser(null);
                    void loadUsers(skip());
                  } else {
                    showErrorNotification("O'chirishda xatolik yuz berdi");
                  }
                }}
                class="rounded-2xl border border-error/20 bg-error/10 px-5 py-2.5 text-xs font-black tracking-wider text-error uppercase transition-all hover:bg-error hover:text-bg active:scale-95"
              >
                <Fa icon="fa-trash-alt" class="mr-2" />
                O'chirish
              </button>
            </div>
          </div>

          {/* Hero Profile Card */}
          <div class="relative overflow-hidden rounded-3xl border border-sub/10 bg-bg/80 p-8 shadow-2xl backdrop-blur-xl">
            <div class="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-main/10 blur-3xl"></div>
            <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-6">
                <div class="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-main to-main/40 text-3xl font-black text-bg shadow-xl shadow-main/20">
                  {selectedUser()?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div class="flex flex-col gap-1">
                  <div class="flex items-center gap-3">
                    <h2 class="text-2xl font-black text-text">
                      {selectedUser()?.name ?? "N/A"}
                    </h2>
                    <span
                      class={cn(
                        "rounded-xl px-3 py-1 text-[11px] font-black tracking-wider uppercase",
                        selectedUser()?.banned
                          ? "bg-error/20 text-error ring-1 ring-error/30"
                          : "bg-green-500/20 text-green-400 ring-1 ring-green-500/30",
                      )}
                    >
                      {selectedUser()?.banned ? "Bloklangan" : "Faol"}
                    </span>
                  </div>
                  <p class="font-medium text-sub">{selectedUser()?.email ?? "—"}</p>
                  <div class="mt-1 flex items-center gap-2">
                    <span class="font-mono text-xs text-sub/70">
                      UID: {selectedUser()?.uid}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div class="rounded-3xl border border-sub/10 bg-bg/80 p-6 shadow-xl backdrop-blur-xl">
              <div class="flex items-center gap-3 text-sub">
                <Fa icon="fa-keyboard" class="text-base text-main" />
                <span class="text-xs font-bold uppercase tracking-wider">Testlar</span>
              </div>
              <p class="mt-3 text-3xl font-black text-text">
                {selectedUser()?.completedTests ?? 0}
              </p>
              <p class="mt-1 text-xs text-sub/70">
                Boshlangan: {selectedUser()?.startedTests ?? selectedUser()?.completedTests ?? 0}
              </p>
            </div>

            <div class="rounded-3xl border border-sub/10 bg-bg/80 p-6 shadow-xl backdrop-blur-xl">
              <div class="flex items-center gap-3 text-sub">
                <Fa icon="fa-clock" class="text-base text-main" />
                <span class="text-xs font-bold uppercase tracking-wider">Yozish vaqti</span>
              </div>
              <p class="mt-3 text-3xl font-black text-text">
                {Math.round((selectedUser()?.timeTyping ?? 0) / 60)} <span class="text-sm font-bold text-sub">min</span>
              </p>
              <p class="mt-1 text-xs text-sub/70">
                Jami sarflangan vaqt
              </p>
            </div>

            <div class="rounded-3xl border border-sub/10 bg-bg/80 p-6 shadow-xl backdrop-blur-xl">
              <div class="flex items-center gap-3 text-sub">
                <Fa icon="fa-star" class="text-base text-main" />
                <span class="text-xs font-bold uppercase tracking-wider">Daraja & XP</span>
              </div>
              <p class="mt-3 text-3xl font-black text-text">
                Level {Math.floor(Math.sqrt((selectedUser()?.xp ?? 0) / 100)) + 1}
              </p>
              <p class="mt-1 text-xs text-sub/70">
                {selectedUser()?.xp ?? 0} XP to'plangan
              </p>
            </div>

            <div class="rounded-3xl border border-sub/10 bg-bg/80 p-6 shadow-xl backdrop-blur-xl">
              <div class="flex items-center gap-3 text-sub">
                <Fa icon="fa-fire" class="text-base text-orange-500" />
                <span class="text-xs font-bold uppercase tracking-wider">Streak</span>
              </div>
              <p class="mt-3 text-3xl font-black text-text">
                {selectedUser()?.streak ?? 0} <span class="text-sm font-bold text-sub">kun</span>
              </p>
              <p class="mt-1 text-xs text-sub/70">
                Maksimal: {selectedUser()?.maxStreak ?? selectedUser()?.streak ?? 0} kun
              </p>
            </div>
          </div>

          {/* Account Details & Security */}
          <div class="grid gap-6 lg:grid-cols-2">
            <div class="rounded-3xl border border-sub/10 bg-bg/80 p-8 shadow-xl backdrop-blur-xl">
              <h3 class="mb-6 text-base font-black text-text uppercase tracking-wider">
                <Fa icon="fa-user-shield" class="mr-2 text-main" />
                Akkaunt Ma'lumotlari
              </h3>
              <div class="space-y-4 text-xs font-semibold">
                <div class="flex items-center justify-between border-b border-sub/5 pb-3">
                  <span class="text-sub">Foydalanuvchi nomi:</span>
                  <span class="text-text font-bold">{selectedUser()?.name ?? "—"}</span>
                </div>
                <div class="flex items-center justify-between border-b border-sub/5 pb-3">
                  <span class="text-sub">Elektron pochta:</span>
                  <span class="text-text font-bold">{selectedUser()?.email ?? "—"}</span>
                </div>
                <div class="flex items-center justify-between border-b border-sub/5 pb-3">
                  <span class="text-sub">Parol xavfsizligi:</span>
                  <span class="font-bold text-green-400">🔒 Bcrypt Hash bilan shifrlangan</span>
                </div>
                <div class="flex items-center justify-between border-b border-sub/5 pb-3">
                  <span class="text-sub">Jinsi:</span>
                  <span class="text-text font-bold">
                    {selectedUser()?.gender === "male"
                      ? "Erkak"
                      : selectedUser()?.gender === "female"
                        ? "Ayol"
                        : "Ko'rsatilmagan"}
                  </span>
                </div>
                <div class="flex items-center justify-between border-b border-sub/5 pb-3">
                  <span class="text-sub">Yozishga sarflangan vaqt:</span>
                  <span class="text-text font-bold">
                    {selectedUser()?.timeTyping ? `${Math.round(selectedUser().timeTyping / 60)} daqiqa` : "—"}
                  </span>
                </div>
                <div class="flex items-center justify-between border-b border-sub/5 pb-3">
                  <span class="text-sub">Ko'rilgan reklamalar:</span>
                  <span class="text-text font-bold">
                    0 ta
                  </span>
                </div>
                <div class="flex items-center justify-between border-b border-sub/5 pb-3">
                  <span class="text-sub">Yoshi:</span>
                  <span class="text-text font-bold">
                    {selectedUser()?.age ? `${selectedUser().age} yosh` : "Ko'rsatilmagan"}
                  </span>
                </div>
                <div class="flex items-center justify-between border-b border-sub/5 pb-3">
                  <span class="text-sub">Ro'yxatdan o'tgan sana:</span>
                  <span class="text-text font-bold">
                    {selectedUser()?.addedAt
                      ? new Date(selectedUser().addedAt).toLocaleString("uz-UZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sub">So'nggi kirish:</span>
                  <span class="text-text font-bold">
                    {selectedUser()?.lastLoginAt
                      ? new Date(selectedUser().lastLoginAt).toLocaleString("uz-UZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Last Test & Activity */}
          <div class="grid gap-6 lg:grid-cols-2">
            {/* Personal Bests */}
            <div class="rounded-3xl border border-sub/10 bg-bg/80 p-8 shadow-xl backdrop-blur-xl lg:col-span-1">
              <h3 class="mb-6 text-base font-black text-text uppercase tracking-wider">
                <Fa icon="fa-trophy" class="mr-2 text-main" />
                Shaxsiy Rekordlar
              </h3>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <For
                  each={[
                    { key: "time_15", label: "15s" },
                    { key: "time_30", label: "30s" },
                    { key: "time_60", label: "60s" },
                    { key: "time_120", label: "120s" },
                    { key: "words_10", label: "10 so'z" },
                    { key: "words_25", label: "25 so'z" },
                    { key: "words_50", label: "50 so'z" },
                    { key: "words_100", label: "100 so'z" },
                  ]}
                >
                  {(item) => {
                    const pbWpm = () =>
                      selectedUser()?.pbs?.[item.key] ??
                      selectedUser()?.personalBests?.time?.[
                        item.key.replace("time_", "")
                      ]?.[0]?.wpm ??
                      selectedUser()?.personalBests?.words?.[
                        item.key.replace("words_", "")
                      ]?.[0]?.wpm;
                    return (
                      <div class="rounded-2xl border border-sub/10 bg-sub-alt/20 p-3 text-center">
                        <span class="text-[10px] font-bold tracking-wider text-sub uppercase">
                          {item.label}
                        </span>
                        <p class="mt-1 text-base font-black text-main">
                          {pbWpm() ? `${pbWpm()} WPM` : "—"}
                        </p>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>

            {/* Last Test */}
            <div class="rounded-3xl border border-sub/10 bg-bg/80 p-8 shadow-xl backdrop-blur-xl lg:col-span-1">
              <h3 class="mb-6 text-base font-black text-text uppercase tracking-wider">
                <Fa icon="fa-history" class="mr-2 text-main" />
                So'nggi Test
              </h3>
              <Show
                when={selectedUser()?.lastTest}
                fallback={
                  <div class="flex h-32 items-center justify-center rounded-2xl border border-dashed border-sub/20 bg-sub-alt/10">
                    <span class="text-sm font-medium text-sub">Test topilmadi</span>
                  </div>
                }
              >
                {(test) => (
                  <div class="flex flex-col gap-4">
                    <div class="flex items-center justify-between rounded-2xl bg-sub-alt/30 p-4">
                      <div class="flex flex-col gap-1">
                        <span class="text-[11px] font-bold text-sub uppercase tracking-wider">
                          Rejim
                        </span>
                        <span class="font-bold text-text">
                          {test().mode} {test().mode2}
                        </span>
                      </div>
                      <div class="flex flex-col gap-1 text-right">
                        <span class="text-[11px] font-bold text-sub uppercase tracking-wider">
                          Sana
                        </span>
                        <span class="font-bold text-text">
                          {new Date(test().timestamp).toLocaleDateString("uz-UZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div class="rounded-2xl bg-main/10 p-3 text-center ring-1 ring-main/20">
                        <span class="text-[10px] font-bold text-main uppercase tracking-wider">WPM</span>
                        <p class="mt-1 text-xl font-black text-main">{test().wpm}</p>
                      </div>
                      <div class="rounded-2xl bg-sub-alt/20 p-3 text-center border border-sub/10">
                        <span class="text-[10px] font-bold text-sub uppercase tracking-wider">Aniqlik</span>
                        <p class="mt-1 text-xl font-black text-text">{test().acc}%</p>
                      </div>
                      <div class="rounded-2xl bg-sub-alt/20 p-3 text-center border border-sub/10">
                        <span class="text-[10px] font-bold text-sub uppercase tracking-wider">Raw</span>
                        <p class="mt-1 text-xl font-black text-text">{test().rawWpm}</p>
                      </div>
                      <div class="rounded-2xl bg-sub-alt/20 p-3 text-center border border-sub/10">
                        <span class="text-[10px] font-bold text-sub uppercase tracking-wider">Til</span>
                        <p class="mt-1 text-sm font-bold text-text">{test().language}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </AdminLayout>
  );
}
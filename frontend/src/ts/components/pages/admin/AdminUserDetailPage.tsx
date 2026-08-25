// oxlint-disable react/no-unescaped-entities, solid/prefer-show, typescript/no-explicit-any, typescript/strict-boolean-expressions, curly, dot-notation, no-unnecessary-type-assertion, typescript/no-unsafe-assignment, typescript/no-unsafe-member-access, typescript/no-unsafe-call, typescript/no-unsafe-return, typescript/no-unsafe-argument, react/no-unknown-property, eslint/prefer-template, react/button-has-type, eslint/no-unused-vars
import { createQuery } from "@tanstack/solid-query";
import { JSXElement, Show, createSignal, onMount, For } from "solid-js";

import Ape from "../../../ape";
import { Page } from "../../common/Page";
import { Fa } from "../../common/Fa";
import { AdminLayout } from "./AdminLayout";
import { navigate } from "../../../controllers/route-controller";

export function AdminUserDetailPage(props: { uid: string }): JSXElement {
  const [selectedTest, setSelectedTest] = createSignal<any | null>(null);

  const userQuery = createQuery(() => ({
    queryKey: ["admin", "user", props.uid],
    queryFn: async () => {
      let pubData = null;
      try {
        const pub = await Ape.users.getProfile({ params: { uidOrName: props.uid } });
        if (pub.status === 200) pubData = pub.body.data;
      } catch {}
      
      let adminData: any = null;
      try {
        const allUsers = await Ape.admin.searchUsers({ query: { q: props.uid } });
        if (allUsers.status === 200) {
          adminData = (allUsers.body.data as any[]).find(u => u.uid === props.uid) ?? null;
        }
      } catch {}
      
      return { pub: pubData, admin: adminData };
    },
    enabled: props.uid !== undefined && props.uid !== "",
  }));

  const testsQuery = createQuery(() => ({
    queryKey: ["admin", "user", props.uid, "tests"],
    queryFn: async () => {
      const res = await Ape.admin.getUserTests({ params: { uid: props.uid } });
      return res.status === 200 ? (res.body.data as any[]) : [];
    },
    enabled: props.uid !== undefined && props.uid !== "",
  }));

  return (
    <Page id="adminUserDetail">
      <AdminLayout active="users" title="Foydalanuvchi haqida malumot">
        <Show
          when={!userQuery.isLoading && userQuery.data !== undefined}
          fallback={
            <div class="flex h-64 items-center justify-center">
              <Fa icon="fa-circle-notch" class="animate-spin text-4xl text-main" />
            </div>
          }
        >
          <div class="flex flex-col gap-6 p-6">
            <button 
              class="flex items-center gap-2 text-sub hover:text-main transition-colors w-fit font-bold"
              onClick={() => navigate("/typeuz-hq/users")}
            >
              <Fa icon="fa-arrow-left" /> Orqaga
            </button>
            <div class="overflow-hidden rounded-3xl border border-sub/10 bg-bg/80 p-8 shadow-2xl backdrop-blur-xl">
              <div class="flex items-start gap-6">
                <div class="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-main/30 to-main/5 text-4xl font-black text-main shadow-inner ring-1 ring-main/20">
                  {(userQuery.data?.admin?.name !== undefined && userQuery.data.admin.name !== "") ? userQuery.data.admin.name.charAt(0).toUpperCase() : "?"}
                </div>
                <div class="flex flex-col gap-2">
                  <h1 class="text-3xl font-black text-text">{userQuery.data?.admin?.name}</h1>
                  <span class="font-mono text-sm text-sub">{userQuery.data?.admin?.uid}</span>
                  <span class="font-semibold text-main">{userQuery.data?.admin?.email}</span>
                </div>
              </div>

              <div class="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="rounded-2xl border border-sub/10 bg-sub-alt/10 p-5">
                  <span class="block text-xs font-bold text-sub uppercase tracking-wider">Tizimga kirish</span>
                  <span class="mt-2 block text-xl font-black text-text">
                    {userQuery.data?.admin?.lastLoginAt !== undefined && userQuery.data.admin.lastLoginAt !== null ? new Date(userQuery.data.admin.lastLoginAt).toLocaleDateString() : "—"}
                  </span>
                </div>
                <div class="rounded-2xl border border-sub/10 bg-sub-alt/10 p-5">
                  <span class="block text-xs font-bold text-sub uppercase tracking-wider">Jami testlar</span>
                  <span class="mt-2 block text-xl font-black text-text">
                    {userQuery.data?.pub?.completedTests ?? 0}
                  </span>
                </div>
                <div class="rounded-2xl border border-sub/10 bg-sub-alt/10 p-5">
                  <span class="block text-xs font-bold text-sub uppercase tracking-wider">Yozish vaqti</span>
                  <span class="mt-2 block text-xl font-black text-text">
                    {((userQuery.data?.pub?.timeTyping ?? 0) / 3600).toFixed(1)} soat
                  </span>
                </div>
                <div class="rounded-2xl border border-sub/10 bg-sub-alt/10 p-5">
                  <span class="block text-xs font-bold text-sub uppercase tracking-wider">Max Streak</span>
                  <span class="mt-2 block text-xl font-black text-text">{userQuery.data?.admin?.maxStreak ?? 0}</span>
                </div>
              </div>

              <div class="mt-10">
                <h3 class="mb-4 text-lg font-bold text-text">So'nggi testlar</h3>
                <div class="overflow-x-auto rounded-xl border border-sub/10">
                  <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr class="border-b border-sub/10 bg-sub-alt/20 text-[11px] font-bold tracking-wider text-sub/80 uppercase">
                        <th class="p-4 pl-6 font-semibold">Vaqt</th>
                        <th class="p-4 font-semibold">WPM</th>
                        <th class="p-4 font-semibold">Aniqlik</th>
                        <th class="p-4 font-semibold">Rejim</th>
                        <th class="p-4 font-semibold">Til</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={testsQuery.data ?? []}>
                        {(t: any) => (
                          <tr
                            class="group border-b border-sub-alt/30 hover:bg-sub-alt/20 cursor-pointer transition-colors"
                            onClick={() => setSelectedTest(t)}
                          >
                            <td class="p-4 pl-6 text-text">
                              {new Date(t.timestamp).toLocaleString()}
                            </td>
                            <td class="p-4">
                              <span class="rounded bg-main/10 px-2 py-1 font-mono font-bold text-main">
                                {t.wpm?.toFixed(2)}
                              </span>
                            </td>
                            <td class="p-4 text-text">{t.acc?.toFixed(2)}%</td>
                            <td class="p-4 text-sub">{t.mode} {t.mode2}</td>
                            <td class="p-4 text-sub">{t.language}</td>
                          </tr>
                        )}
                      </For>
                      <Show when={testsQuery.isSuccess && testsQuery.data?.length === 0}>
                        <tr>
                          <td colspan="5" class="p-8 text-center text-sub">Testlar mavjud emas</td>
                        </tr>
                      </Show>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="mt-10 rounded-2xl border border-sub/10 bg-sub-alt/5 p-6">
                <h3 class="mb-4 text-lg font-bold text-error">Xavfli amallar</h3>
                
                <div class="flex max-w-sm flex-col gap-2">
                  <label class="text-sm font-semibold text-text">Foydalanuvchi parolini o'zgartirish</label>
                  <form
                    class="flex gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const input = (e.target as HTMLFormElement).elements.namedItem("newPassword") as HTMLInputElement;
                      if (!input.value || input.value.length < 6) {
                        alert("Parol kamida 6 belgidan iborat bo'lishi kerak!");
                        return;
                      }
                      try {
                        const res = await Ape.admin.changeUserPassword({
                          body: { uid: props.uid, newPassword: input.value },
                        });
                        if (res.status === 200) {
                          alert("Parol muvaffaqiyatli o'zgartirildi!");
                          input.value = "";
                        } else {
                          alert("Xatolik: " + res.body.message);
                        }
                      } catch (err) {
                        alert("Tarmoq xatosi!");
                      }
                    }}
                  >
                    <input
                      name="newPassword"
                      type="password"
                      placeholder="Yangi parol..."
                      class="flex-1 rounded-lg border border-sub/20 bg-bg p-2 text-text outline-none focus:border-main"
                    />
                    <button
                      type="submit"
                      class="rounded-lg bg-error/90 px-4 py-2 font-bold text-bg transition-colors hover:bg-error"
                    >
                      Saqlash
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Test Modal */}
        <Show when={selectedTest()}>
          <div class="fixed inset-0 z-[200] flex items-center justify-center bg-bg/80 backdrop-blur-sm p-4">
            <div class="relative w-full max-w-2xl rounded-3xl border border-sub/10 bg-bg p-8 shadow-2xl">
              <button
                class="absolute right-6 top-6 text-sub hover:text-main"
                onClick={() => setSelectedTest(null)}
              >
                <Fa icon="fa-times" class="text-xl" />
              </button>
              <h2 class="mb-6 text-2xl font-black text-text">Test tafsilotlari</h2>
              
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div class="rounded-xl bg-sub-alt/10 p-4 text-center">
                  <span class="block text-[10px] uppercase text-sub font-bold">WPM</span>
                  <span class="text-2xl font-black text-main">{selectedTest().wpm?.toFixed(2)}</span>
                </div>
                <div class="rounded-xl bg-sub-alt/10 p-4 text-center">
                  <span class="block text-[10px] uppercase text-sub font-bold">RAW WPM</span>
                  <span class="text-2xl font-black text-text">{selectedTest().rawWpm?.toFixed(2)}</span>
                </div>
                <div class="rounded-xl bg-sub-alt/10 p-4 text-center">
                  <span class="block text-[10px] uppercase text-sub font-bold">Aniqlik</span>
                  <span class="text-2xl font-black text-text">{selectedTest().acc?.toFixed(2)}%</span>
                </div>
                <div class="rounded-xl bg-sub-alt/10 p-4 text-center">
                  <span class="block text-[10px] uppercase text-sub font-bold">Vaqt</span>
                  <span class="text-2xl font-black text-text">{selectedTest().testDuration?.toFixed(1)}s</span>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex justify-between border-b border-sub/10 pb-2">
                  <span class="text-sub">Rejim</span>
                  <span class="font-bold text-text">{selectedTest().mode} {selectedTest().mode2}</span>
                </div>
                <div class="flex justify-between border-b border-sub/10 pb-2">
                  <span class="text-sub">Til</span>
                  <span class="font-bold text-text">{selectedTest().language}</span>
                </div>
                <div class="flex justify-between border-b border-sub/10 pb-2">
                  <span class="text-sub">Belgilar (to'g'ri/noto'g'ri/ortiqcha/qoldirilgan)</span>
                  <span class="font-bold text-text">
                    {selectedTest().charStats?.join(" / ")}
                  </span>
                </div>
                <div class="flex justify-between border-b border-sub/10 pb-2">
                  <span class="text-sub">Konsistentlik</span>
                  <span class="font-bold text-text">{selectedTest().consistency?.toFixed(2)}%</span>
                </div>
                <div class="flex justify-between pb-2">
                  <span class="text-sub">Test vaqti</span>
                  <span class="font-bold text-text">
                    {new Date(selectedTest().timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </AdminLayout>
    </Page>
  );
}

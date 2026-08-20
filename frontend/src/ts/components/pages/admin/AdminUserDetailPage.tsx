import { createQuery } from "@tanstack/solid-query";
import { JSXElement, Show, createSignal, onMount } from "solid-js";

import Ape from "../../../ape";
import { Page } from "../../common/Page";
import { Fa } from "../../common/Fa";
import { AdminLayout } from "./AdminLayout";
import { navigate } from "../../../controllers/route-controller";

export function AdminUserDetailPage(props: { uid: string }): JSXElement {
  const userQuery = createQuery(() => ({
    queryKey: ["admin", "user", props.uid],
    queryFn: async () => {
      // Fetch user profile from public endpoints
      let pubData = null;
      try {
        const pub = await Ape.users.getProfile({ params: { uid: props.uid } });
        if (pub.status === 200) pubData = pub.body.data;
      } catch {
        /* ignore */
      }
      
      // Fetch basic user list and match the user for admin metadata
      let adminData: { name?: string, uid?: string, email?: string, lastLoginAt?: number } | null = null;
      try {
        // Just search by uid
        const allUsers = await Ape.admin.searchUsers({ query: { q: props.uid } });
        if (allUsers.status === 200) {
          adminData = (allUsers.body.data as { name?: string, uid?: string, email?: string, lastLoginAt?: number }[]).find(u => u.uid === props.uid) ?? null;
        }
      } catch {
        /* ignore */
      }
      
      return { pub: pubData, admin: adminData };
    },
    enabled: props.uid !== undefined && props.uid !== "",
  }));

  return (
    <Page id="adminUserDetail">
      <AdminLayout title="Foydalanuvchi haqida malumot">
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
                  <span class="block text-xs font-bold text-sub uppercase tracking-wider">Reklama ko'rgan</span>
                  <span class="mt-2 block text-xl font-black text-text">0 marta</span>
                </div>
              </div>
            </div>
          </div>
        </Show>
      </AdminLayout>
    </Page>
  );
}

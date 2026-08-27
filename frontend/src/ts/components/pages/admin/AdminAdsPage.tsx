import { createForm } from "@tanstack/solid-form";
import { createMutation, createQuery } from "@tanstack/solid-query";
import { JSXElement, Show, For } from "solid-js";

import Ape from "../../../ape";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../../states/notifications";
import { Fa } from "../../common/Fa";
import { AdminLayout } from "./AdminLayout";

type AdSlot = {
  slotId: string;
  enabled: boolean;
  creativeId?: string;
  imageUrl?: string;
  targetUrl?: string;
};
export function AdminAdsPage(): JSXElement {
  const adQuery = createQuery(() => ({
    queryKey: ["admin", "adConfig"],
    queryFn: async () => {
      const r = await Ape.admin.getAdConfig();
      return r.status === 200 ? r.body.data : null;
    },
  }));

  const toggleAd = () => {
    const c = adQuery.data;
    if (!c) return;
    void Ape.admin
      .updateAdConfig({ body: { ...c, enabled: !c.enabled } })
      .then((r) => {
        if (r.status === 200) {
          showSuccessNotification("Reklama holati o'zgartirildi");
          void adQuery.refetch();
        } else {
          showErrorNotification("Xatolik: " + r.status);
        }
      })
      .catch(() => showErrorNotification("Xatolik"));
  };

  const creativeForm = createForm(() => ({
    defaultValues: { imageUrl: "", targetUrl: "", size: "" },
    onSubmit: async ({ value }) => {
      try {
        const r = await Ape.admin.addCreative({ body: value });
        if (r.status === 200) {
          showSuccessNotification("Kreativ qo'shildi");
          void adQuery.refetch();
        } else {
          showErrorNotification("Xatolik: " + r.status);
        }
      } catch {
        showErrorNotification("Xatolik");
      }
    },
  }));

  const deleteCreative = createMutation(() => ({
    mutationFn: async (id: string) =>
      Ape.admin.deleteCreative({ params: { id } }),
    onSuccess: () => {
      showSuccessNotification("O'chirildi");
      void adQuery.refetch();
    },
    onError: () => showErrorNotification("Xatolik"),
  }));

  const updateSlot = (slotId: string, updates: Partial<AdSlot>) => {
    const c = adQuery.data;
    if (!c) return;

    if (updates.creativeId !== undefined && updates.creativeId !== "") {
      const cr = c.creatives.find((x) => x.id === updates.creativeId);
      if (cr) {
        updates.imageUrl = cr.imageUrl;
        updates.targetUrl = cr.targetUrl;
      } else {
        updates.imageUrl = "";
        updates.targetUrl = "";
      }
    }

    const newSlots = c.slots.map((s) =>
      s.slotId === slotId ? { ...s, ...updates } : s,
    );
    // if slot doesn't exist yet, add it
    if (!newSlots.find((s) => s.slotId === slotId)) {
      newSlots.push({ slotId, enabled: false, ...updates });
    }
    void Ape.admin
      .updateAdConfig({ body: { ...c, slots: newSlots } })
      .then((r) => {
        if (r.status === 200) {
          showSuccessNotification("Slot saqlandi");
          void adQuery.refetch();
        } else {
          showErrorNotification("Xatolik: " + r.status);
        }
      })
      .catch(() => showErrorNotification("Xatolik"));
  };

  const PREDEFINED_SLOTS = [
    { id: "ad-result", label: "Test natijasi (Tegida)" },
    { id: "ad-about-1", label: "Biz haqimizda (Tepa)" },
    { id: "ad-about-2", label: "Biz haqimizda (Past)" },
    { id: "ad-account-1", label: "Profil sahifasi (Tepa)" },
    { id: "ad-account-2", label: "Profil sahifasi (Past)" },
    { id: "ad-landing-hero", label: "Asosiy sahifa (Hero)" },
    { id: "ad-leaderboard", label: "Reyting sahifasi" },
  ];

  return (
    <AdminLayout active="ads" title="Reklama boshqaruvi">
      <div class="grid gap-6 lg:grid-cols-2">
        {/* Status */}
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">Umumiy Sozlamalar</h2>
          <Show
            when={adQuery.data}
            fallback={<p class="text-xs text-sub">Yuklanmoqda...</p>}
          >
            <div class="space-y-4 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-text">Barcha reklamalar (Global)</span>
                <button
                  type="button"
                  onClick={toggleAd}
                  class={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${adQuery.data?.enabled === true ? "bg-green-600 text-white" : "bg-sub-alt text-sub"}`}
                >
                  {adQuery.data?.enabled === true
                    ? "Yoqilgan"
                    : "O&apos;chirilgan"}
                </button>
              </div>
              <div class="text-xs text-sub">
                Slotlar: {adQuery.data?.slots?.length ?? 0} | Kreativlar:{" "}
                {adQuery.data?.creatives?.length ?? 0}
              </div>
            </div>
          </Show>
        </div>

        {/* Add creative */}
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">
            Yangi Reklama Qushish (Kreativ)
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void creativeForm.handleSubmit();
            }}
            class="flex flex-col gap-3"
          >
            <creativeForm.Field name="imageUrl">
              {(f) => (
                <div class="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*,image/gif"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          f().handleChange(event.target.result.toString());
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    class="w-full text-xs text-sub file:mr-4 file:rounded-full file:border-0 file:bg-main/20 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-main hover:file:bg-main/30"
                  />
                  <Show when={f().state.value}>
                    <div class="h-20 w-20 overflow-hidden rounded-xl border border-sub/20">
                      <img
                        src={f().state.value}
                        class="h-full w-full object-cover"
                      />
                    </div>
                  </Show>
                </div>
              )}
            </creativeForm.Field>
            <creativeForm.Field name="targetUrl">
              {(f) => (
                <input
                  value={f().state.value}
                  onInput={(e) => f().handleChange(e.currentTarget.value)}
                  placeholder="Havola URL (https://...)"
                  class="w-full rounded-xl bg-sub-alt p-3 text-sm text-text ring-1 ring-sub/20 outline-none focus:ring-main"
                />
              )}
            </creativeForm.Field>
            <creativeForm.Field name="size">
              {(f) => (
                <select
                  value={f().state.value}
                  onInput={(e) => f().handleChange(e.currentTarget.value)}
                  class="w-full rounded-xl bg-sub-alt p-3 text-sm text-text ring-1 ring-sub/20 outline-none focus:ring-main"
                >
                  <option value="">O'lchamni tanlang (Ixtiyoriy)</option>
                  <option value="leaderboard">Leaderboard (728x90)</option>
                  <option value="banner">Banner (468x60)</option>
                  <option value="medium">Medium Rectangle (300x250)</option>
                  <option value="skyscraper">Skyscraper (120x600)</option>
                </select>
              )}
            </creativeForm.Field>
            <button
              type="submit"
              class="rounded-xl bg-main px-4 py-2.5 text-sm font-medium text-bg hover:opacity-90"
            >
              Qo&apos;shish
            </button>
          </form>
        </div>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Slots Mapping */}
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">
            Reklama Joylari (Slotlar)
          </h2>
          <Show
            when={adQuery.data}
            fallback={<p class="text-xs text-sub">Yuklanmoqda...</p>}
          >
            <div class="space-y-4">
              <For each={PREDEFINED_SLOTS}>
                {(slotInfo) => {
                  const slotData = () =>
                    adQuery.data?.slots?.find((s) => s.slotId === slotInfo.id);
                  return (
                    <div class="flex flex-col gap-2 rounded-lg bg-sub-alt/30 p-4">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-bold text-text">
                          {slotInfo.label}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateSlot(slotInfo.id, {
                              enabled: !(slotData()?.enabled ?? false),
                            })
                          }
                          class={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${slotData()?.enabled ? "bg-green-600 text-white" : "bg-sub-alt text-sub"}`}
                        >
                          {slotData()?.enabled
                            ? "Yoqilgan"
                            : "O&apos;chirilgan"}
                        </button>
                      </div>
                      <span class="text-xs text-sub opacity-50">
                        ID: {slotInfo.id}
                      </span>
                      <div class="mt-2 flex items-center gap-2">
                        <select
                          class="w-full rounded-xl bg-bg p-2 text-xs text-text ring-1 ring-sub/20 outline-none focus:ring-main"
                          value={slotData()?.creativeId ?? ""}
                          onChange={(e) =>
                            updateSlot(slotInfo.id, {
                              creativeId: e.currentTarget.value,
                            })
                          }
                        >
                          <option value="">(Reklama tanlanmagan)</option>
                          <For each={adQuery.data?.creatives ?? []}>
                            {(cr) => (
                              <option value={cr.id}>
                                {cr.imageUrl.slice(0, 30)}...
                              </option>
                            )}
                          </For>
                        </select>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </div>

        {/* Existing creatives */}
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">
            Mavjud kreativlar (Ro&apos;yxat)
          </h2>
          <Show
            when={(adQuery.data?.creatives?.length ?? 0) > 0}
            fallback={<p class="text-xs text-sub">Kreativlar yo&apos;q</p>}
          >
            <div class="space-y-3">
              <For each={adQuery.data?.creatives ?? []}>
                {(cr) => (
                  <div class="flex flex-col gap-2 rounded-lg bg-sub-alt/30 px-4 py-3 text-xs">
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-[10px] text-sub opacity-50">
                        ID: {cr.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteCreative.mutate(cr.id)}
                        class="rounded-lg bg-error/20 px-2.5 py-1.5 text-error hover:bg-error hover:text-bg"
                      >
                        <Fa icon="fa-trash" />
                      </button>
                    </div>
                    <div class="flex items-start gap-3">
                      <img
                        src={cr.imageUrl}
                        class="h-12 w-12 rounded object-cover"
                      />
                      <div class="flex flex-col gap-1 overflow-hidden text-xs">
                        <span class="truncate text-text">
                          Rasm: {cr.imageUrl}
                        </span>
                        <span class="truncate text-main">
                          Havola: {cr.targetUrl || "Yo'q"}
                        </span>
                        <Show when={cr.size}>
                          <span class="truncate text-sub">
                            O'lcham: {cr.size}
                          </span>
                        </Show>
                      </div>
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

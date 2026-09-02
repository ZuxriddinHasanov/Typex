// oxlint-disable react/no-unescaped-entities, solid/prefer-show, typescript/no-explicit-any, typescript/strict-boolean-expressions, curly, dot-notation, no-unnecessary-type-assertion, typescript/no-unsafe-assignment, typescript/no-unsafe-member-access, typescript/no-unsafe-return, typescript/no-unsafe-call, @tanstack/query/exhaustive-deps
import { createQuery } from "@tanstack/solid-query";
import { JSXElement, Show, createSignal } from "solid-js";
import { envConfig } from "virtual:env-config";

import Ape from "../../../ape";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../../states/notifications";
import { cn } from "../../../utils/cn";
import { getStoredToken } from "../../../utils/custom-auth";
import { Fa } from "../../common/Fa";
import { AdminLayout } from "./AdminLayout";

export function AdminSettingsPage(): JSXElement {
  const [accentColor, setAccentColor] = createSignal("#ff5a1f");
  const [isDark, setIsDark] = createSignal(true);
  const [pwdResult, setPwdResult] = createSignal("");
  const [pwdState, setPwdState] = createSignal<
    "idle" | "loading" | "success" | "error"
  >("idle");

  createQuery(() => ({
    queryKey: ["admin", "theme", "settings"],
    queryFn: async () => {
      const r = await Ape.admin.getThemeSettings();
      if (r.status === 200) {
        const d = r.body.data as { accentColor?: string; isDark?: boolean };
        if (d?.accentColor) setAccentColor(d.accentColor);
        if (d?.isDark !== undefined) setIsDark(d.isDark);
      }
      return null;
    },
  }));

  const saveTheme = async () => {
    try {
      await Ape.admin.updateThemeSettings({
        body: { accentColor: accentColor(), isDark: isDark() },
      });
      document.documentElement.style.setProperty("--main-color", accentColor());
      document.documentElement.style.setProperty(
        "--caret-color",
        accentColor(),
      );
      showSuccessNotification("Rang saqlandi");
    } catch {
      showErrorNotification("Xatolik");
    }
  };

  const changePassword = async (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const cp = fd.get("currentPassword") as string;
    const np = fd.get("newPassword") as string;
    const cf = fd.get("confirmPassword") as string;
    if (np !== cf) {
      setPwdResult("Yangi parollar mos emas");
      setPwdState("error");
      return;
    }
    if (np.length < 8) {
      setPwdResult("Kamida 8 belgi");
      setPwdState("error");
      return;
    }
    setPwdState("loading");
    try {
      const token = getStoredToken();
      const res = await fetch(
        `${envConfig.backendUrl}/auth/admin/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ currentPassword: cp, newPassword: np }),
        },
      );
      const json = (await res.json()) as { message: string };
      if (res.ok) {
        setPwdResult("Parol o'zgartirildi");
        setPwdState("success");
        form.reset();
      } else {
        setPwdResult(`Xatolik: ${json.message}`);
        setPwdState("error");
      }
    } catch {
      setPwdResult("Server xatosi");
      setPwdState("error");
    }
  };

  return (
    <AdminLayout active="settings" title="Sozlamalar">
      <div class="grid gap-6 lg:grid-cols-2">
        {/* Theme */}
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">Akkent rangi</h2>
          <div class="flex items-center gap-4">
            <input aria-label="Input field"
              type="color"
              value={accentColor()}
              onInput={(e) => setAccentColor(e.currentTarget.value)}
              class="h-12 w-24 cursor-pointer rounded-xl border-0 bg-transparent"
            />
            <div>
              <span class="text-sm text-text">Hozirgi: {accentColor()}</span>
              <span class="block text-xs text-sub">
                Asosiy to'q sariq (#ff5a1f)
              </span>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-3">
            <span class="text-sm text-text">Tema:</span>
            <button
              type="button"
              onClick={() => setIsDark(true)}
              class={cn(
                "rounded-xl px-4 py-2 text-sm transition-colors",
                isDark() ? "bg-main text-bg" : "bg-sub-alt text-sub",
              )}
            >
              Qorong'i
            </button>
            <button
              type="button"
              onClick={() => setIsDark(false)}
              class={cn(
                "rounded-xl px-4 py-2 text-sm transition-colors",
                !isDark() ? "bg-main text-bg" : "bg-sub-alt text-sub",
              )}
            >
              Yorug'
            </button>
          </div>
          <button
            type="button"
            onClick={saveTheme}
            class="mt-4 rounded-xl bg-main px-6 py-2.5 text-sm font-bold text-bg hover:opacity-90"
          >
            <Fa icon="fa-save" class="mr-2" />
            Saqlash
          </button>
        </div>

        {/* Password */}
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">Parolni o'zgartirish</h2>
          <form onSubmit={changePassword} class="flex flex-col gap-3">
            <input aria-label="Input field"
              name="currentPassword"
              type="password"
              placeholder="Joriy parol"
              autocomplete="current-password"
              required
              minLength={1}
              class="w-full rounded-xl bg-sub-alt p-3 text-sm text-text ring-1 ring-sub/20 outline-none focus:ring-main"
            />
            <input aria-label="Input field"
              name="newPassword"
              type="password"
              placeholder="Yangi parol (8+ belgi)"
              autocomplete="new-password"
              required
              minLength={8}
              class="w-full rounded-xl bg-sub-alt p-3 text-sm text-text ring-1 ring-sub/20 outline-none focus:ring-main"
            />
            <input aria-label="Input field"
              name="confirmPassword"
              type="password"
              placeholder="Yangi parolni takrorlang"
              autocomplete="new-password"
              required
              minLength={8}
              class="w-full rounded-xl bg-sub-alt p-3 text-sm text-text ring-1 ring-sub/20 outline-none focus:ring-main"
            />
            <button
              type="submit"
              disabled={pwdState() === "loading"}
              class="rounded-xl bg-main px-4 py-2.5 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-50"
            >
              {pwdState() === "loading"
                ? "Yuborilmoqda..."
                : "Parolni o'zgartirish"}
            </button>
            <Show when={pwdResult()}>
              <p
                class={`text-sm ${pwdState() === "success" ? "text-green-500" : "text-error"}`}
              >
                {pwdResult()}
              </p>
            </Show>
          </form>
        </div>
      </div>

      <div class="mt-6 rounded-2xl border border-sub/10 bg-bg/60 p-5">
        <h2 class="mb-3 text-sm font-bold text-text">Ma'lumot</h2>
        <p class="text-sm text-sub">
          Admin endpointlari himoyalangan. So'rovlar cheklangan.
        </p>
        <p class="mt-1 text-xs text-sub/60">Dev login: admin / admin123</p>
      </div>
    </AdminLayout>
  );
}

// oxlint-disable react/no-unescaped-entities, solid/prefer-show, typescript/no-explicit-any, typescript/strict-boolean-expressions, curly, dot-notation, no-unnecessary-type-assertion, typescript/no-unsafe-assignment, typescript/no-unsafe-member-access, typescript/no-unsafe-call, typescript/no-unsafe-return, typescript/no-unsafe-argument
import { JSXElement, Show, createSignal } from "solid-js";

import Ape from "../../../ape";
import { showErrorNotification } from "../../../states/notifications";
import { Fa } from "../../common/Fa";
import { AdminLayout } from "./AdminLayout";

type AiResult = {
  avgWpm: number;
  avgAccuracy: number;
  totalTests: number;
  bestWpm: number;
  trend: string;
  recommendation: string;
};

export function AdminAIPage(): JSXElement {
  const [result, setResult] = createSignal<AiResult | null>(null);
  const [loading, setLoading] = createSignal(false);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await Ape.users.getWeeklyAnalysis();
      if (res.status === 200) setResult((res.body.data as AiResult) ?? null);
      else showErrorNotification("Tahlil xatosi");
    } catch {
      showErrorNotification("Server xatosi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout active="ai" title="AI tahlil">
      <div class="rounded-2xl border border-sub/10 bg-bg/60 p-6">
        <p class="mb-6 text-sm text-sub">
          Ushbu bo'lim orqali foydalanuvchilarning so'nggi 7 kunlik yozuv
          tezligi tahlilini ko'rish mumkin.
        </p>
        <button aria-label="Button"
          type="button"
          onClick={run}
          disabled={loading()}
          class="rounded-xl bg-main px-6 py-3 text-sm font-bold text-bg hover:opacity-90 disabled:opacity-50"
        >
          {loading() ? (
            "Yuklanmoqda..."
          ) : (
            <>
              <Fa icon="fa-brain" class="mr-2" />
              Tahlilni ishga tushirish
            </>
          )}
        </button>

        <Show when={result() !== null}>
          <div class="mt-8 rounded-2xl border border-sub/20 bg-sub-alt/30 p-6">
            <h3 class="mb-6 text-base font-bold text-text">
              Tahlil natijalari
            </h3>
            <div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <span class="text-xs text-sub">O'rtacha WPM</span>
                <div class="text-2xl font-bold text-text">
                  {result()?.avgWpm ?? "—"}
                </div>
              </div>
              <div>
                <span class="text-xs text-sub">Aniqlik</span>
                <div class="text-2xl font-bold text-text">
                  {result()?.avgAccuracy ?? "—"}%
                </div>
              </div>
              <div>
                <span class="text-xs text-sub">Testlar</span>
                <div class="text-2xl font-bold text-text">
                  {result()?.totalTests ?? "—"}
                </div>
              </div>
              <div>
                <span class="text-xs text-sub">Eng yaxshi WPM</span>
                <div class="text-2xl font-bold text-text">
                  {result()?.bestWpm ?? "—"}
                </div>
              </div>
            </div>
            <div class="mt-4 flex items-center gap-2 text-sm">
              <span class="text-sub">Trend:</span>
              <span
                class={
                  result()?.trend === "improving"
                    ? "text-green-400"
                    : result()?.trend === "declining"
                      ? "text-red-400"
                      : "text-sub"
                }
              >
                {result()?.trend === "improving"
                  ? "Yaxshilanmoqda"
                  : result()?.trend === "declining"
                    ? "Yomonlashmoqda"
                    : (result()?.trend ?? "—")}
              </span>
            </div>
            <Show when={result()?.recommendation}>
              <div class="mt-4 rounded-lg bg-sub-alt/50 p-4 text-sm text-sub">
                <span class="font-semibold text-text">Tavsiya: </span>
                {result()?.recommendation}
              </div>
            </Show>
          </div>
        </Show>
      </div>
    </AdminLayout>
  );
}

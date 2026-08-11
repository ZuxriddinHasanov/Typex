import { For, JSXElement, Show } from "solid-js";

import { setConfig } from "../../../config/setters";
import { getConfig } from "../../../config/store";
import { restartTestEvent } from "../../../events/test";
import {
  getContentType,
  setContentType,
  ContentType,
} from "../../../states/content-type";
import { showModal } from "../../../states/modals";
import { getFocus, getResultVisible } from "../../../states/test";
import { cn } from "../../../utils/cn";
import SlimSelect from "../../ui/SlimSelect";

const modes = [
  { value: "time", label: "Vaqt" },
  { value: "words", label: "So'z" },
  { value: "ai", label: "AI" },
] as const;

const times = [15, 30, 60, 120] as const;
const words = [10, 25, 50, 100] as const;

const languages = [
  { value: "uzbek", text: "O'zbek" },
  { value: "english", text: "English" },
  { value: "russian", text: "Русский" },
];

const contentTypes: { value: ContentType; label: string }[] = [
  { value: "words", label: "Harflar" },
  { value: "numbers", label: "Raqamlar" },
  { value: "mixed", label: "Aralash" },
];

export function TestConfig(): JSXElement {
  const activeType = () => getContentType();

  return (
    <div
      class={cn(
        "flex flex-col items-center gap-4 py-6 transition-opacity duration-125",
        getFocus() && !getResultVisible()
          ? "pointer-events-none opacity-0"
          : "",
        getResultVisible() ? "hidden" : "",
      )}
      data-ui-element="testConfig"
    >
      <div class="flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-sub-alt/30 p-1.5">
        <For each={modes}>
          {(mode) => (
            <button
              type="button"
              class={cn(
                "min-w-[4rem] rounded-xl px-4 py-1.5 text-sm font-medium transition-all duration-200",
                getConfig.mode === mode.value
                  ? "bg-main text-bg shadow-sm"
                  : "text-sub hover:text-main",
              )}
              onClick={() => {
                setConfig("mode", mode.value);
                if (mode.value === "ai") {
                  setConfig("words", 50);
                }
                restartTestEvent.dispatch();
              }}
            >
              {mode.label}
            </button>
          )}
        </For>
      </div>

      <Show when={getConfig.mode === "time" || getConfig.mode === "words"}>
        <div class="flex flex-wrap items-center justify-center gap-2">
          <For each={getConfig.mode === "time" ? times : words}>
            {(val) => (
              <button
                type="button"
                class={cn(
                  "min-w-[3rem] rounded-xl px-4 py-1.5 text-sm font-medium transition-all duration-200",
                  (
                    getConfig.mode === "time"
                      ? getConfig.time === val
                      : getConfig.words === val
                  )
                    ? "bg-main/10 text-main"
                    : "text-sub hover:bg-sub-alt/50 hover:text-main",
                )}
                onClick={() => {
                  if (getConfig.mode === "time") {
                    setConfig("time", val);
                  } else {
                    setConfig("words", val);
                  }
                  restartTestEvent.dispatch();
                }}
              >
                {val}
              </button>
            )}
          </For>
          <button
            type="button"
            class={cn(
              "flex min-w-[3rem] items-center gap-2 rounded-xl px-4 py-1.5 text-sm font-medium transition-all duration-200",
              getConfig.mode === "time"
                ? !times.includes(getConfig.time as (typeof times)[number])
                : !words.includes(getConfig.words as (typeof words)[number])
                  ? "bg-main/10 text-main"
                  : "text-sub hover:bg-sub-alt/50 hover:text-main",
            )}
            onClick={() =>
              showModal(
                getConfig.mode === "time" ? "TestDuration" : "CustomWordAmount",
              )
            }
          >
            <i class="fas fa-sliders-h"></i>
            Custom
          </button>
        </div>
      </Show>

      <div class="mt-2 flex flex-wrap items-center justify-center gap-6">
        <div class="relative z-50 flex min-w-[120px] items-center gap-2">
          <span class="shrink-0 text-xs text-sub">Til:</span>
          <SlimSelect
            selected={getConfig.language}
            onChange={(v) => {
              if (v !== undefined && v !== "") {
                setConfig("language", v as typeof getConfig.language);
                restartTestEvent.dispatch();
              }
            }}
            options={languages}
            settings={{
              showSearch: false,
            }}
          />
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-sub">Tur:</span>
          <div class="flex gap-1 rounded-lg bg-sub-alt/30 p-1">
            <For each={contentTypes}>
              {(ct) => (
                <button
                  type="button"
                  class={cn(
                    "rounded-md px-3 py-1 text-xs font-medium transition-all duration-200",
                    activeType() === ct.value
                      ? "bg-main text-bg shadow-sm"
                      : "text-sub hover:bg-sub-alt hover:text-main",
                  )}
                  onClick={() => {
                    setContentType(ct.value);
                    setConfig(
                      "numbers",
                      ct.value === "mixed" || ct.value === "numbers",
                    );
                    restartTestEvent.dispatch();
                  }}
                >
                  {ct.label}
                </button>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
}

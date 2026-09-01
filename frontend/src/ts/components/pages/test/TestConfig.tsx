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

const times = [1, 10, 15, 30, 60, 120] as const;
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
        "flex flex-col items-center gap-2 py-6 transition-opacity duration-125",
        getFocus() && !getResultVisible()
          ? "pointer-events-none opacity-0"
          : "",
        getResultVisible() ? "hidden" : "",
      )}
      data-ui-element="testConfig"
    >
      {/* Yagona Unified Toolbar (Bir qator) */}
      <div class="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-sub-alt/20 p-2.5 shadow-sm backdrop-blur-md md:gap-4">
        {/* Rejimlar */}
        <div class="flex items-center gap-1">
          <For each={modes}>
            {(mode) => (
              <button
                type="button"
                class={cn(
                  "rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-200",
                  getConfig.mode === mode.value
                    ? "bg-main text-bg shadow-sm"
                    : "text-sub hover:bg-sub-alt/30 hover:text-text",
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

        {/* Qiymatlar */}
        <Show when={getConfig.mode === "time" || getConfig.mode === "words"}>
          <div class="hidden h-6 w-px bg-sub/30 lg:block"></div>
          <div class="flex items-center gap-1">
            <For each={getConfig.mode === "time" ? times : words}>
              {(val) => (
                <button
                  type="button"
                  class={cn(
                    "min-w-[3rem] rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                    (
                      getConfig.mode === "time"
                        ? getConfig.time === val
                        : getConfig.words === val
                    )
                      ? "bg-main/10 font-bold text-main"
                      : "text-sub hover:bg-sub-alt/30 hover:text-text",
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
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200",
                getConfig.mode === "time"
                  ? !times.includes(getConfig.time as (typeof times)[number])
                  : !words.includes(getConfig.words as (typeof words)[number])
                    ? "bg-main/10 font-bold text-main"
                    : "text-sub hover:bg-sub-alt/30 hover:text-text",
              )}
              onClick={() =>
                showModal(
                  getConfig.mode === "time"
                    ? "TestDuration"
                    : "CustomWordAmount",
                )
              }
            >
              <i class="fas fa-sliders-h"></i> Maxsus </button>
          </div>
        </Show>

        {/* Til */}
        <div class="hidden h-6 w-px bg-sub/30 xl:block"></div>
        <div class="flex flex-wrap items-center gap-4 border-t border-sub/10 pt-2 xl:border-none xl:pt-0">
          <div class="relative z-50 flex items-center gap-2">
            <span class="pl-2 text-xs font-semibold tracking-wider text-sub uppercase">
              Til:
            </span>
            <div class="min-w-[120px]">
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
          </div>
        </div>
      </div>

      {/* Tur (Pastki qatorda) */}
      <div class="mt-1 flex flex-wrap items-center justify-center gap-2 rounded-xl bg-sub-alt/10 px-4 py-1.5 shadow-sm">
        <span class="pr-1 text-xs font-semibold tracking-wider text-sub uppercase">
          Tur:
        </span>
        <div class="flex gap-1">
          <For each={contentTypes}>
            {(ct) => (
              <button
                type="button"
                class={cn(
                  "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all duration-200",
                  activeType() === ct.value
                    ? "bg-sub-alt text-text shadow-sm"
                    : "text-sub hover:bg-sub-alt/50 hover:text-text",
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
  );
}

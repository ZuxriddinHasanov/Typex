import { For, JSXElement } from "solid-js";

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
import { SelectField } from "../../ui/form/SelectField";

const times = [15, 30, 60, 120] as const;

const languages = [
  { value: "uzbek", label: "O'zbek" },
  { value: "english", label: "English" },
  { value: "russian", label: "Русский" },
] as const;

const contentTypes: { value: ContentType; label: string }[] = [
  { value: "words", label: "So'zlar" },
  { value: "numbers", label: "Raqamlar" },
  { value: "mixed", label: "Aralash" },
];

export function TestConfig(): JSXElement {
  const activeType = () => getContentType();

  return (
    <div
      class={cn(
        "flex flex-col items-center gap-4 py-6 transition-opacity duration-125",
        getFocus() && !getResultVisible() ? "pointer-events-none opacity-0" : "",
        getResultVisible() ? "hidden" : "",
      )}
      data-ui-element="testConfig"
    >
      <div class="flex flex-wrap items-center justify-center gap-3">
        <For each={times}>
          {(time) => (
            <button
              type="button"
              class={cn(
                "min-w-[3rem] rounded-(--roundness) px-4 py-2 text-sm font-medium transition-all duration-125",
                getConfig.time === time
                  ? "bg-main text-bg"
                  : "bg-sub-alt text-sub hover:bg-main hover:text-bg",
              )}
              onClick={() => {
                setConfig("time", time);
                restartTestEvent.dispatch();
              }}
            >
              {time}
            </button>
          )}
        </For>
        <button
          type="button"
          class={cn(
            "min-w-[3rem] rounded-(--roundness) px-4 py-2 text-sm font-medium transition-all duration-125",
            ![15, 30, 60, 120].includes(getConfig.time)
              ? "bg-main text-bg"
              : "bg-sub-alt text-sub hover:bg-main hover:text-bg",
          )}
          onClick={() => showModal("TestDuration")}
        >
          <i class="fas fa-sliders-h mr-1"></i>
          Custom
        </button>
        <button
          type="button"
          class={cn(
            "min-w-[3rem] rounded-(--roundness) px-4 py-2 text-sm font-medium transition-all duration-125",
            getConfig.mode === "ai"
              ? "bg-main text-bg"
              : "bg-sub-alt text-sub hover:bg-main hover:text-bg",
          )}
          onClick={() => {
            setConfig("mode", "ai");
            setConfig("words", 50);
            restartTestEvent.dispatch();
          }}
        >
          AI
        </button>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-6">
        <div class="flex items-center gap-2">
          <span class="text-xs text-sub">Til:</span>
          <SelectField
            value={getConfig.language}
            onChange={(v) => {
              setConfig("language", v as typeof getConfig.language);
              restartTestEvent.dispatch();
            }}
            options={languages.map((l) => ({ value: l.value, label: l.label }))}
            class="bg-sub-alt px-3 py-1.5"
          />
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-sub">Tur:</span>
          <div class="flex gap-1">
            <For each={contentTypes}>
              {(ct) => (
                <button
                  type="button"
                  class={cn(
                    "rounded-(--roundness) px-3 py-1.5 text-xs font-medium transition-all duration-125",
                    activeType() === ct.value
                      ? "bg-main text-bg"
                      : "bg-sub-alt text-sub hover:bg-main hover:text-bg",
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

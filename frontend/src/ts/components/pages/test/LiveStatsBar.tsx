import { JSXElement } from "solid-js";

import { getConfig } from "../../../config/store";
import { getFocus, getResultVisible } from "../../../states/test";
import { cn } from "../../../utils/cn";
import { getContentType } from "../../../states/content-type";

const languageLabels: Record<string, string> = {
  uzbek: "O'zbek",
  english: "English",
  russian: "Русский",
};

const contentTypeLabels: Record<string, string> = {
  words: "So'zlar",
  numbers: "Raqamlar",
  mixed: "Aralash",
};

export function LiveStatsBar(): JSXElement {
  return (
    <div
      class={cn(
        "flex items-center justify-center gap-6 text-xs transition-opacity duration-125",
        getFocus() && !getResultVisible()
          ? "pointer-events-none opacity-0"
          : getResultVisible() ? "hidden" : "opacity-100",
      )}
    >
      <span class="text-sub">
        {getConfig.time}s
      </span>
      <span class="text-sub/60">|</span>
      <span class="text-sub">
        {languageLabels[getConfig.language] ?? getConfig.language}
      </span>
      <span class="text-sub/60">|</span>
      <span class="text-sub">
        {contentTypeLabels[getContentType()] ?? getContentType()}
      </span>
    </div>
  );
}

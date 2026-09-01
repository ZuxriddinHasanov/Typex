import { JSXElement } from "solid-js";

import { cn } from "../../../utils/cn";
import { Button } from "../../common/Button";

export function QuickNav(props: { class?: string }): JSXElement {
  const buttonClass = "px-3 py-3";
  return (
    <div class={props.class}>
      <div
        class={cn(
          "mx-auto rounded bg-sub-alt text-em-xs",
          "grid w-full grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]",
          "lg:block lg:w-max lg:grid-cols-none",
        )}
      >
        <Button
          class={cn(buttonClass, "pl-6")}
          variant="text"
          href="#group_behavior"
          text="ishlash tartibi"
          fa={{
            icon: "fa-tools",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#group_input"
          text="kiritish"
          fa={{
            icon: "fa-keyboard",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#group_sound"
          text="ovoz"
          fa={{
            icon: "fa-volume-up",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#group_caret"
          text="kursor"
          fa={{
            icon: "fa-i-cursor",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#group_appearance"
          text="tashqi ko'rinish"
          fa={{
            icon: "fa-palette",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#group_theme"
          text="mavzu"
          fa={{
            icon: "fa-brush",
          }}
        />
        <Button
          class={buttonClass}
          variant="text"
          href="#group_hideElements"
          text="elementlarni yashirish"
          fa={{
            icon: "fa-eye-slash",
          }}
        />
        <Button
          class={cn(buttonClass, "pr-6")}
          variant="text"
          href="#group_dangerZone"
          text="xavfli hudud"
          fa={{
            icon: "fa-exclamation-triangle",
          }}
        />
      </div>
    </div>
  );
}

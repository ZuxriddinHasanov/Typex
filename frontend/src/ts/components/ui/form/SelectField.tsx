// oxlint-disable typescript/no-non-null-assertion
import { Accessor, For, JSXElement, Show } from "solid-js";
import type { AnyFieldApi } from "@tanstack/solid-form";
import { cn } from "../../../utils/cn";
import { Fa } from "../../common/Fa";
import { FieldIndicator } from "./FieldIndicator";

export type SelectOption = {
  value: string;
  label: string;
};

export function SelectField(props: {
  field?: Accessor<AnyFieldApi>;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  class?: string;
  label?: string;
}): JSXElement {
  return (
    <div class="flex flex-col gap-1.5">
      <Show when={props.label}>
        <label class="text-xs font-medium text-sub">{props.label}</label>
      </Show>
      <div class="relative">
        <select aria-label="Select field"
          value={props.field ? String(props.field().state.value) : props.value}
          onChange={(e) => {
            if (props.field) {
              props.field().handleChange(e.currentTarget.value);
            } else {
              props.onChange?.(e.currentTarget.value);
            }
          }}
          disabled={props.disabled}
          class={cn(
            "w-full appearance-none rounded border-none bg-sub-alt p-[0.5em] pr-[1.85em] text-em-base leading-[1.25em] text-text caret-main outline-none transition-colors focus-visible:shadow-[0_0_0_0.1rem_var(--bg-color),0_0_0_0.2rem_var(--text-color)]",
            props.class,
          )}
        >
          <Show when={props.placeholder}>
            <option value="">{props.placeholder}</option>
          </Show>
          <For each={props.options}>
            {(opt) => <option value={opt.value}>{opt.label}</option>}
          </For>
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-[0.4em] text-sub">
          <Fa icon="fa-chevron-down" class="h-[0.75em] w-[0.75em]" />
        </div>
      </div>
      <Show when={props.field && props.field().options.validators}>
        <FieldIndicator field={props.field!()} />
      </Show>
    </div>
  );
}

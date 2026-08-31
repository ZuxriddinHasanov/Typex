import { JSXElement, Show } from "solid-js";
import { cn } from "../../utils/cn";

type Props = {
  variant: "fromCorner" | "atCorner" | "center" | "corner";
  show: boolean;
  count?: number;
  class?: string;
};

export function NotificationBubble(props: Props): JSXElement {
  return (
    <Show when={props.show}>
      <div
        class={cn(
          "absolute flex items-center justify-center rounded-full bg-main ring-[0.25em] ring-bg text-bg font-bold shadow-lg",
          props.count && props.count > 0 ? "h-[1.5em] min-w-[1.5em] px-1 text-[0.65rem] leading-none" : "h-[0.5em] w-[0.5em]",
          (props.variant === "fromCorner" || props.variant === "corner") && "top-0 right-0 m-[0.375em]",
          props.variant === "atCorner" &&
            "top-0 right-0 translate-x-1/2 -translate-y-1/2",
          props.variant === "center" &&
            "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
          props.class,
        )}
        data-ui-element="notificationBubble"
      >
        <Show when={props.count && props.count > 0}>
          {props.count! > 99 ? '99+' : props.count}
        </Show>
      </div>
    </Show>
  );
}

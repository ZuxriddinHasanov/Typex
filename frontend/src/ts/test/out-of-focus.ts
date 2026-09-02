import * as Misc from "../utils/misc";
import { Config } from "../config/store";
import { qs, qsa } from "../utils/dom";

const outOfFocusTimeouts: (number | NodeJS.Timeout)[] = [];

const messages = {
  default: "Fokuslash uchun shu yerni yoki istalgan tugmani bosing",
  window: "Oynani fokuslash uchun istalgan joyni bosing",
};

export function hide(): void {
  qsa("#words, #compositionDisplay")
    ?.setStyle({ transition: "none" })
    ?.removeClass("blurred");
  qs(".outOfFocusWarning")?.hide();
  Misc.clearTimeouts(outOfFocusTimeouts);
}

export function show(mode: "default" | "window" = "default"): void {
  if (!Config.showOutOfFocusWarning) return;
  outOfFocusTimeouts.push(
    setTimeout(() => {
      qsa("#words, #compositionDisplay")
        ?.setStyle({ transition: "0.25s" })
        ?.addClass("blurred");
      qs(".outOfFocusWarning .text")?.setText(messages[mode]);
      qs(".outOfFocusWarning")?.show();
    }, 1000),
  );
}

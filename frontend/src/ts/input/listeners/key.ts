import { getInputElement } from "../input-element";
import { onKeyup } from "../handlers/keyup";
import { onKeydown } from "../handlers/keydown";

const inputEl = getInputElement();

inputEl.addEventListener("keyup", async (event) => {
  await onKeyup(event);
});

inputEl.addEventListener("keydown", async (event) => {
  await onKeydown(event);
});

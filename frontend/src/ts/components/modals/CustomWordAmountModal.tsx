import { createForm } from "@tanstack/solid-form";
import { JSXElement } from "solid-js";
import { z } from "zod";

import { setConfig } from "../../config/setters";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import { hideModalAndClearChain } from "../../states/modals";
import { showNoticeNotification } from "../../states/notifications";
import { AnimatedModal } from "../common/AnimatedModal";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { fromSchema } from "../ui/form/utils";

export function CustomWordAmountModal(): JSXElement {
  const form = createForm(() => ({
    defaultValues: {
      words: getConfig.words,
    },
    onSubmit: ({ value }) => {
      const val = value.words;
      setConfig("words", val);
      restartTestEvent.dispatch();

      if (val > 2000) {
        showNoticeNotification("O'zingizni asrang va tanaffuslar qiling!");
      } else if (val === 0) {
        showNoticeNotification(
          "Cheksiz so'zlar! Natijani saqlash uchun buyruqlar panelidan (command line) Bail Out qilishni unutmang.",
          { durationMs: 7000 },
        );
      }

      hideModalAndClearChain("CustomWordAmount");
    },
  }));

  return (
    <AnimatedModal
      id="CustomWordAmount"
      title="Maxsus so'zlar miqdori"
      focusFirstInput="focusAndSelect"
      beforeShow={() => {
        form.reset({ words: getConfig.words });
      }}
    >
      <form
        class="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="words"
          validators={{
            onChange: fromSchema(z.number().nonnegative().safe()),
          }}
          children={(field) => (
            <InputField field={field} type="number" placeholder="so'zlar miqdori" />
          )}
        />
        <div class="text-xs">
          0 raqamini kiritish orqali cheksiz testni boshlashingiz mumkin. Keyin testni to'xtatish uchun,
          Bail Out funksiyasidan foydalaning:
          <br />(<kbd>esc</kbd> or <kbd>ctrl/cmd</kbd> + <kbd>shift</kbd> +{" "}
          <kbd>p</kbd> &gt; Bail Out)
        </div>
        <SubmitButton
          form={form}
          variant="button"
          text="qo'llash"
          skipUnchangedCheck
        />
      </form>
    </AnimatedModal>
  );
}

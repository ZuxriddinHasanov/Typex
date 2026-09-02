import { createForm } from "@tanstack/solid-form";
import { JSXElement, Show } from "solid-js";

import { setConfig } from "../../config/setters";
import { getConfig } from "../../config/store";
import { restartTestEvent } from "../../events/test";
import { hideModalAndClearChain } from "../../states/modals";
import { showNoticeNotification } from "../../states/notifications";
import { AnimatedModal } from "../common/AnimatedModal";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";

const MIN_DURATION = 1;
const MAX_DURATION = 1800;

export function CustomTestDurationModal(): JSXElement {
  const form = createForm(() => ({
    defaultValues: {
      duration: getConfig.time.toString(),
    },
    onSubmit: ({ value }) => {
      const val = parseInput(value.duration);

      if (isNaN(val) || !isFinite(val) || val < 0) {
        showNoticeNotification("Davomiylik musbat raqam bo'lishi kerak");
        return;
      }

      if (val !== 0 && val < MIN_DURATION) {
        showNoticeNotification(`Minimal davomiylik: ${MIN_DURATION} soniya`);
        return;
      }

      if (val > MAX_DURATION) {
        showNoticeNotification(`Maximum duration is ${MAX_DURATION / 60} daqiqa`);
        return;
      }

      setConfig("time", val);
      restartTestEvent.dispatch();

      if (val >= 1200) {
        showNoticeNotification("O'zingizni asrang va tanaffuslar qiling!");
      }

      hideModalAndClearChain("TestDuration");
    },
  }));

  const durationValue = form.useStore((s) => s.values.duration);

  const validationError = () => {
    const val = parseInput(durationValue());
    if (isNaN(val) || !isFinite(val)) {
      return "Raqam bo'lishi kerak";
    }
    if (val !== 0 && val < MIN_DURATION) {
      return `Minimal: ${MIN_DURATION} soniya`;
    }
    if (val > MAX_DURATION) {
      return `Maksimal: ${MAX_DURATION / 60} daqiqa`;
    }
    return undefined;
  };

  const humanTime = () => {
    const duration = parseInput(durationValue());

    if (isNaN(duration) || duration < 0) {
      return "";
    } else if (duration === 0) {
      return "Cheksiz test";
    } else {
      return format(duration);
    }
  };

  return (
    <AnimatedModal
      id="TestDuration"
      title="Test davomiyligi"
      focusFirstInput="focusAndSelect"
      beforeShow={() => {
        form.reset({ duration: getConfig.time.toString() });
      }}
    >
      <form
        class="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !validationError()) {
            e.preventDefault();
            void form.handleSubmit();
          }
        }}
      >
        <div class="text-xs text-sub">{humanTime()}</div>
        <form.Field
          name="duration"
          validators={{
            onChange: () => validationError(),
          }}
          children={(field) => (
            <InputField
              field={field}
              type="text"
              placeholder={`${MIN_DURATION}-${MAX_DURATION} soniya`}
            />
          )}
        />
        <Show when={validationError()}>
          <span class="text-xs text-error">{validationError()}</span>
        </Show>
        <div class="text-xs text-sub/60">
          Chegara: {MIN_DURATION}s – {MAX_DURATION / 60} daq. Tasdiqlash uchun Enter tugmasini bosing.
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

function format(duration: number): string {
  const hours = Math.floor(duration / 3600);
  const daqiqa = Math.floor((duration % 3600) / 60);
  const soniya = duration % 60;

  const time = [];

  if (hours > 0) {
    time.push(`${hours}h`);
  }

  if (daqiqa > 0) {
    time.push(`${daqiqa}m`);
  }

  if (soniya > 0) {
    time.push(`${soniya}s`);
  }

  if (time.length === 0) {
    return "0s";
  }

  return time.join(" ");
}

function parseInput(input: string): number {
  const re = /((-\s*)?\d+(\.\d+)?\s*[hms]?)/g;
  const soniya = [...input.toLowerCase().matchAll(re)]
    .map((match) => {
      const part = match[0];
      const duration = parseFloat(part.replace(/\s+/g, ""));

      if (part.includes("h")) {
        return 3600 * duration;
      } else if (part.includes("m")) {
        return 60 * duration;
      } else {
        return duration;
      }
    })
    .reduce((total, dur) => total + dur, 0);

  return Math.floor(soniya);
}

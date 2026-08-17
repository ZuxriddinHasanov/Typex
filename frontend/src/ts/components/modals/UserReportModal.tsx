import { createForm } from "@tanstack/solid-form";
import { ReportUserCommentSchema } from "@typeuz/contracts/users";
import { ReportUserReason } from "@typeuz/schemas/users";

import Ape from "../../ape";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModal } from "../../states/modals";
import {
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { getUserToReport, setUserToReport } from "../../states/user-report";
import { AnimatedModal } from "../common/AnimatedModal";
import { Captcha } from "../ui/form/Captcha";
import { LabeledField } from "../ui/form/LabeledField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { TextareaField } from "../ui/form/TextareaField";
import { allFieldsMandatory, fromSchema } from "../ui/form/utils";
import SlimSelect from "../ui/SlimSelect";

export function UserReportModal() {
  const form = createForm(() => ({
    defaultValues: {
      uid: getUserToReport()?.uid ?? "",
      reason: "Inappropriate name",
      comment: "",
      captcha: "",
    },
    onSubmit: async ({ value }) => {
      await apply(value);
      form.reset();
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Please fill in all fields");
    },
    validators: {
      onChange: allFieldsMandatory(),
    },
  }));
  return (
    <AnimatedModal
      modalClass="max-w-3xl"
      id="UserReport"
      mode="dialog"
      title={`Foydalanuvchi ustidan shikoyat: ${getUserToReport()?.name ?? ""}`}
    >
      <p class="text-sm text-sub">
        Iltimos, asosli shikoyat qoldiring. Qoidabuzarlik haqidagi xabaringiz
        ma&apos;muriyat tomonidan ko&apos;rib chiqiladi va Telegram orqali xabar
        beriladi.
      </p>

      <form
        class="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="reason"
          children={(field) => (
            <LabeledField label="Sabab">
              <SlimSelect
                appendTo="container"
                options={[
                  { value: "Inappropriate name", text: "Noo'rin ism" },
                  { value: "Inappropriate bio", text: "Noo'rin bio/tavsif" },
                  {
                    value: "Inappropriate social links",
                    text: "Noo'rin ijtimoiy tarmoq havolalari",
                  },
                  ...[
                    !getUserToReport()?.lbOptOut
                      ? {
                          value: "Suspected cheating",
                          text: "Qalloblik / Cheat shubhasi",
                        }
                      : undefined,
                  ],
                ].filter((it) => it !== undefined)}
                selected={field().state.value}
                onChange={(val) => field().handleChange(val as string)}
                settings={{ showSearch: false }}
              />
            </LabeledField>
          )}
        />

        <form.Field
          name="comment"
          validators={{ onChange: fromSchema(ReportUserCommentSchema) }}
          children={(field) => (
            <LabeledField label="Qo'shimcha izoh">
              <div class="relative">
                <TextareaField
                  field={field}
                  class="bg-bg-secondary min-h-50 w-full rounded p-2 text-text"
                  autocomplete="off"
                  placeholder="Shikoyat sababini batafsil yozing..."
                />
                <div
                  class={`absolute right-2 bottom-2 text-xs ${250 - field().state.value.length < 0 ? "text-error" : "text-sub"}`}
                >
                  {250 - field().state.value.length}
                </div>
              </div>
            </LabeledField>
          )}
        />
        <form.Field
          name="captcha"
          children={(field) => <Captcha field={field} />}
        />
        <SubmitButton form={form} text="Shikoyatni yuborish" class="w-full" />
      </form>
    </AnimatedModal>
  );
}

async function apply(options: {
  uid: string;
  reason: string;
  comment: string;
  captcha: string;
}): Promise<void> {
  const { uid, reason, comment, captcha } = options;

  showLoaderBar();
  const response = await Ape.users.report({
    body: {
      uid,
      reason: reason as ReportUserReason,
      comment,
      captcha,
    },
  });
  hideLoaderBar();

  if (response.status !== 200) {
    showErrorNotification("Shikoyat yuborishda xatolik yuz berdi", {
      response,
    });
    return;
  }

  showSuccessNotification("Shikoyat qabul qilindi. Rahmat!");
  setUserToReport(null);
  hideModal("UserReport");
}

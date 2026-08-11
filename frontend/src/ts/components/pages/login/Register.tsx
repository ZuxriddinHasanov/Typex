import { createForm } from "@tanstack/solid-form";
import { UserEmailSchema, UserNameSchema } from "@typeuz/schemas/users";
import { JSXElement } from "solid-js";
import { envConfig } from "virtual:env-config";

import Ape from "../../../ape";
import { getPasswordSchema, signUp } from "../../../auth";
import TypoList from "../../../constants/typo-list";
import { navigate } from "../../../controllers/route-controller";
import {
  disableLoginPageInputs,
  enableLoginPageInputs,
  getLoginPageInputsEnabled,
} from "../../../states/login";
import {
  showErrorNotification,
  showNoticeNotification,
} from "../../../states/notifications";
import { remoteValidationForm } from "../../../utils/remote-validation";
import { H3 } from "../../common/Headers";
import { showRegisterCaptchaModal } from "../../modals/RegisterCaptchaModal";
import { InputField } from "../../ui/form/InputField";
import { SubmitButton } from "../../ui/form/SubmitButton";
import {
  fromSchema,
  handleResult,
  ValidationResult,
} from "../../ui/form/utils";

let disposableEmailModule: typeof import("disposable-email-domains-js") | null =
  null;
let moduleLoadAttempted = false;

export function Register(): JSXElement {
  let usernameManuallyEdited = false;

  const emailIsValid = async (
    email: string,
  ): Promise<undefined | ValidationResult[]> => {
    const messages: ValidationResult[] = [];

    const educationRegex =
      /@.*(student|education|school|\.edu$|\.edu\.|\.ac\.|\.sch\.)/i;
    if (educationRegex.test(email)) {
      messages.push({
        type: "warning",
        message:
          "Ba'zi ta'lim email manzillari xabar qabul qilishda muammo keltirishi mumkin. Shaxsiy email manzilidan foydalanishni tavsiya qilamiz.",
      });
    }

    const emailHasTypo = TypoList.some((typo) => email.endsWith(typo));
    if (emailHasTypo) {
      messages.push({
        type: "warning",
        message: "Email manzilingizni tekshiring, xatolik bo'lishi mumkin.",
      });
    }

    if (
      disposableEmailModule &&
      disposableEmailModule.isDisposableEmail !== undefined
    ) {
      try {
        if (disposableEmailModule.isDisposableEmail(email)) {
          messages.push({
            type: "warning",
            message:
              "Vaqtinchalik email dan foydalanish kirish, parol tiklash va yordam olishda muammo keltirishi mumkin. Doimiy email manzilidan foydalaning.",
          });
        }
      } catch {
        // Silent failure
      }
    }

    return messages.length > 0 ? messages : undefined;
  };

  const isCaptchaEnabled = envConfig.recaptchaSiteKey !== "";

  const form = createForm(() => ({
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      disableLoginPageInputs();
      let captchaToken: string | undefined;
      if (isCaptchaEnabled) {
        captchaToken = await showRegisterCaptchaModal();
        if (captchaToken === undefined || captchaToken === "") {
          showErrorNotification("Captcha ni tasdiqlang");
          enableLoginPageInputs();
          return;
        }
      }
      try {
        const data = await signUp(
          value.username,
          value.email,
          value.password,
          captchaToken ?? "",
          undefined,
          undefined,
          undefined,
          value.firstName,
          value.lastName,
        );
        if (!data.success) {
          showErrorNotification(data.message);
        } else {
          void navigate("/account");
        }
      } finally {
        enableLoginPageInputs();
      }
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Iltimos, barcha maydonlarni to'ldiring");
    },
    validators: {},
  }));

  const updateUsername = (firstName: string, lastName: string) => {
    if (!usernameManuallyEdited) {
      const generated = (firstName + lastName)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .substring(0, 14);
      if (generated) {
        form.setFieldValue("username", generated);
      }
    }
  };

  return (
    <div class="grid w-full grid-cols-1 justify-center gap-4 sm:w-96">
      <H3 text="ro'yxatdan o'tish" fa={{ icon: "fa-user-plus" }} class="p-0" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!form.state.canSubmit || !form.state.isValid) {
            form.options.onSubmitInvalid?.({
              value: form.state.values,
              formApi: form,
              meta: undefined,
            });
            return;
          }
          void form.options.onSubmit?.({
            value: form.state.values,
            formApi: form,
            meta: undefined,
          });
        }}
        action=""
        // oxlint-disable-next-line react/no-unknown-property
        autocomplete="off"
        class="grid w-full gap-3"
      >
        <form.Field
          name="firstName"
          validators={{
            onChange: (field) => {
              updateUsername(field.value, form.getFieldValue("lastName"));
              if (field.value.length === 0) {
                return "Ism kiritish majburiy";
              }
              if (field.value.length > 50) {
                return "Ism 50 belgidan oshmasligi kerak";
              }
              return undefined;
            },
          }}
          children={(field) => (
            <InputField
              field={field}
              placeholder="ism"
              autocomplete="given-name"
              disabled={!getLoginPageInputsEnabled()}
            />
          )}
        />
        <form.Field
          name="lastName"
          validators={{
            onChange: (field) => {
              updateUsername(form.getFieldValue("firstName"), field.value);
              if (field.value.length === 0) {
                return "Familiya kiritish majburiy";
              }
              if (field.value.length > 50) {
                return "Familiya 50 belgidan oshmasligi kerak";
              }
              return undefined;
            },
          }}
          children={(field) => (
            <InputField
              field={field}
              placeholder="familiya"
              autocomplete="family-name"
              disabled={!getLoginPageInputsEnabled()}
            />
          )}
        />
        <form.Field
          name="username"
          validators={{
            onChange: fromSchema(UserNameSchema),
            onChangeAsyncDebounceMs: 1000,
            onChangeAsync: remoteValidationForm(
              async (name: string) =>
                Ape.users.getNameAvailability({ params: { name } }),
              { check: (data) => data.available || "Bu nom band" },
            ),
          }}
          children={(field) => (
            <InputField
              field={field}
              placeholder="foydalanuvchi nomi"
              autocomplete="new-username"
              disabled={!getLoginPageInputsEnabled()}
              onFocus={() => {
                usernameManuallyEdited = true;
              }}
            />
          )}
        />
        <form.Field
          name="email"
          validators={{
            onChange: fromSchema(UserEmailSchema),
            onChangeAsyncDebounceMs: 0,
            onChangeAsync: async (field) =>
              handleResult(field.fieldApi, await emailIsValid(field.value)),
          }}
          children={(field) => (
            <InputField
              field={field}
              placeholder="email"
              autocomplete="new-email"
              disabled={!getLoginPageInputsEnabled()}
              onFocus={() => {
                if (!moduleLoadAttempted) {
                  moduleLoadAttempted = true;
                  void import("disposable-email-domains-js")
                    .then((it) => (disposableEmailModule = it))
                    .catch(() => {
                      // Silent failure
                    });
                }
              }}
            />
          )}
        />
        <form.Field
          name="password"
          validators={{
            onChange: fromSchema(getPasswordSchema({ isNew: true })),
          }}
          children={(field) => (
            <InputField
              field={field}
              placeholder="parol"
              autocomplete="new-password"
              type="password"
              disabled={!getLoginPageInputsEnabled()}
            />
          )}
        />
        <SubmitButton
          form={form}
          fa={{ icon: "fa-user-plus" }}
          text="ro'yxatdan o'tish"
          disabled={!getLoginPageInputsEnabled()}
        />
      </form>
    </div>
  );
}

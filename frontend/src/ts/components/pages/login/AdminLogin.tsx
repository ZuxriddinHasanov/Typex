import { createForm } from "@tanstack/solid-form";
import { JSXElement } from "solid-js";

import {
  disableLoginPageInputs,
  enableLoginPageInputs,
  getLoginPageInputsEnabled,
} from "../../../states/login";
import {
  showErrorNotification,
  showNoticeNotification,
} from "../../../states/notifications";
import { setStoredToken, clearStoredToken } from "../../../utils/custom-auth";
import { Button } from "../../common/Button";
import { Fa } from "../../common/Fa";
import { InputField } from "../../ui/form/InputField";
import { SubmitButton } from "../../ui/form/SubmitButton";
import { allFieldsMandatory } from "../../ui/form/utils";
import { cn } from "../../../utils/cn";
import { envConfig } from "virtual:env-config";

export function AdminLogin(): JSXElement {
  const handleAdminSignIn = async (
    username: string,
    password: string,
  ): Promise<void> => {
    disableLoginPageInputs();
    try {
      const res = await fetch(`${envConfig.backendUrl}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = (await res.json()) as {
        message: string;
        data?: { token: string };
      };
      if (!res.ok) {
        showErrorNotification(
          `Kirish muvaffaqiyatsiz: ${json.message}`,
        );
        return;
      }
      if (json.data) {
        clearStoredToken();
        setStoredToken(json.data.token);
        window.location.href = "/typeuz-hq/dashboard";
      }
    } catch {
      showErrorNotification("Admin serveriga ulanishda xatolik");
    } finally {
      enableLoginPageInputs();
    }
  };

  const form = createForm(() => ({
    defaultValues: {
      username: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await handleAdminSignIn(value.username, value.password);
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Iltimos, barcha maydonlarni to'ldiring");
    },
    validators: {
      onChange: allFieldsMandatory(),
    },
  }));

  return (
    <div
      class={cn(
        "mx-auto grid w-full max-w-md gap-6",
        "rounded-2xl border-2 border-main/20 bg-bg/60 p-8",
        "shadow-[0_0_30px_-5px] shadow-main/10",
      )}
    >
      <div class="grid place-items-center gap-3 text-center">
        <div
          class={cn(
            "grid h-16 w-16 place-items-center rounded-full",
            "bg-gradient-to-br from-main to-main/60",
          )}
        >
          <Fa icon="fa-shield-alt" size={1.5} class="text-bg" />
        </div>
        <div>
          <h2 class="text-xl font-bold tracking-wider text-text">
            Admin panel
          </h2>
          <p class="mt-1 text-sm text-sub">Faqat adminlar uchun</p>
        </div>
      </div>

      <form
        class="grid w-full gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <form.Field
          name="username"
          children={(field) => (
            <div class="relative">
              <div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sub">
                <Fa icon="fa-user" size={1.1} />
              </div>
              <InputField
                field={field}
                placeholder="admin username"
                autocomplete="username"
                disabled={!getLoginPageInputsEnabled()}
                class="pl-[2.4em]"
              />
            </div>
          )}
        />
        <form.Field
          name="password"
          children={(field) => (
            <div class="relative">
              <div class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sub">
                <Fa icon="fa-lock" size={1.1} />
              </div>
              <InputField
                field={field}
                placeholder="parol"
                type="password"
                autocomplete="current-password"
                disabled={!getLoginPageInputsEnabled()}
                class="pl-[2.4em]"
              />
            </div>
          )}
        />

        <SubmitButton
          form={form}
          fa={{ icon: "fa-shield-alt" }}
          text="admin panelga kirish"
          disabled={!getLoginPageInputsEnabled()}
          class="bg-main text-bg hover:opacity-90"
        />
      </form>

      <div class="text-center">
        <Button
          href="/"
          router-link
          class="text-xs text-sub underline-offset-2 hover:text-main hover:underline"
        >
          <Fa icon="fa-arrow-left" class="mr-1" />
          asosiy sahifaga qaytish
        </Button>
      </div>
    </div>
  );
}

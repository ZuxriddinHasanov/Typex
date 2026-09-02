import { AnyFieldApi } from "@tanstack/solid-form";
import { Accessor, onCleanup, onMount } from "solid-js";
import { envConfig } from "virtual:env-config";

import { useRefWithUtils } from "../../../hooks/useRefWithUtils";
import { showErrorNotification } from "../../../states/notifications";

type Grecaptcha = {
  render: (
    element: HTMLElement | string,
    options: {
      sitekey: string;
      callback?: (responseToken: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => number;
  reset: (widgetId: number) => void;
  getResponse: (widgetId: number) => string;
};

async function loadRecaptchaScript(): Promise<void> {
  if (typeof document === "undefined") throw new Error("no document");
  if (document.querySelector('script[src*="recaptcha/api.js"]')) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
    document.head.appendChild(script);
  });
}

async function waitForGrecaptcha(retries = 20): Promise<Grecaptcha> {
  for (let i = retries; i > 0; i--) {
    const g = (window as { grecaptcha?: Grecaptcha }).grecaptcha;
    if (g && typeof g.render === "function") return g;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("reCAPTCHA not available after timeout");
}

export function Captcha(props: {
  field: Accessor<AnyFieldApi>;
  class?: string;
  onSuccess?: (responseToken: string) => void;
}) {
  const [captchaRef, captchaEl] = useRefWithUtils<HTMLDivElement>();
  let mounted = true;

  onCleanup(() => {
    mounted = false;
  });

  const isRecaptchaEnabled = envConfig.recaptchaSiteKey !== "";

  const renderCaptcha = (container: HTMLElement): void => {
    if (!isRecaptchaEnabled) {
      container.innerHTML = `
        <div class="flex flex-col items-center gap-2 p-4 text-center">
          <span class="text-sm text-sub">CAPTCHA o'chirilgan</span>
        </div>
      `;
      return;
    }
    const g = (window as { grecaptcha?: Grecaptcha }).grecaptcha;
    if (!g) return;
    container.innerHTML = "";
    g.render(container, {
      sitekey: envConfig.recaptchaSiteKey,
      callback: (token: string) => {
        props.field().setValue(token);
        props.onSuccess?.(token);
      },
      "expired-callback": () => {
        props.field().setValue("");
      },
      "error-callback": () => {
        props.field().setValue("");
      },
    });
  };

  const showRetry = (container: HTMLElement): void => {
    container.innerHTML = "";
    const fallback = document.createElement("div");
    fallback.className = "flex flex-col items-center gap-2 p-4 text-center";
    fallback.innerHTML = `
      <span class="text-sm text-sub">Captcha yuklanmadi.</span>
      <button aria-label="Button" type="button" class="rounded-lg bg-main px-4 py-2 text-sm font-medium text-bg">Qayta urinish</button>
    `;
    container.appendChild(fallback);
    fallback.querySelector("button")?.addEventListener("click", () => {
      container.innerHTML = "";
      void (async () => {
        try {
          await loadRecaptchaScript();
          if (!mounted) return;
          await waitForGrecaptcha();
          if (!mounted) return;
          renderCaptcha(container);
        } catch {
          showRetry(container);
          showErrorNotification("Captcha hozir mavjud emas. Sahifani yangilang.");
        }
      })();
    });
  };

  onMount(async () => {
    const el = captchaEl();
    const native = el?.native;
    if (!native) return;

    if (!isRecaptchaEnabled) {
      renderCaptcha(native);
      return;
    }

    try {
      await loadRecaptchaScript();
      if (!mounted) return;
      await waitForGrecaptcha();
      if (!mounted) return;
      renderCaptcha(native);
    } catch {
      if (mounted) showRetry(native);
    }
  });

  return <div ref={captchaRef} class={props.class}></div>;
}

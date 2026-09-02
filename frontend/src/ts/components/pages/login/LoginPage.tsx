import { createSignal, JSXElement, Show } from "solid-js";

import { setUserId } from "../../../states/core";
import { getLoginPageInputsEnabled } from "../../../states/login";
import { devLogin } from "../../../utils/dev-auth";
import { isDevEnvironment } from "../../../utils/env";
import { Fa } from "../../common/Fa";
import { Page } from "../../common/Page";
import { Login } from "./Login";
import { Register } from "./Register";

export function LoginPage(): JSXElement {
  const isSignUpDisabled = (): boolean => false;
  const [devLoginUsername, setDevLoginUsername] = createSignal("");
  const [devLoginFeedback, setDevLoginFeedback] = createSignal("");
  const [devLoggingIn, setDevLoggingIn] = createSignal(false);

  const handleDevLogin = async (): Promise<void> => {
    const username = devLoginUsername().trim();
    if (!username) return;
    setDevLoggingIn(true);
    setDevLoginFeedback("");
    try {
      const auth = await devLogin(username);
      setUserId(auth.uid);
      localStorage.removeItem("typeuz_onboarding_done");
      window.location.href = "/onboarding";
    } catch (e) {
      setDevLoginFeedback((e as Error).message);
    } finally {
      setDevLoggingIn(false);
    }
  };

  return (
    <Page id="login">
      <Show when={!getLoginPageInputsEnabled()}>
        <div class="fixed top-1/2 left-1/2 z-1 -translate-x-1/2 -translate-y-1/2 text-3xl text-main transition-opacity duration-250">
          <Fa icon="fa-circle-notch" fixedWidth spin />
        </div>
      </Show>
      <Show
        when={isSignUpDisabled()}
        fallback={
          <div class="flex h-full w-full max-w-7xl flex-col items-center justify-center gap-12 py-10">
            <div class="flex w-full flex-col items-start justify-around gap-16 md:flex-row md:gap-8">
              <Register />
              <div class="hidden h-[500px] w-px bg-sub/10 md:block"></div>
              <div class="flex flex-col gap-4">
                <Login />
                <Show when={isDevEnvironment()}>
                  <div class="rounded-2xl border border-sub/10 bg-bg/50 p-4">
                    <p class="mb-2 text-sm font-semibold text-sub">Dev Login</p>
                    <div class="flex gap-2">
                      <input aria-label="Input field"
                        type="text"
                        placeholder="Username"
                        value={devLoginUsername()}
                        onInput={(e) =>
                          setDevLoginUsername(e.currentTarget.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleDevLogin();
                        }}
                        class="min-w-0 flex-1 rounded-lg border border-sub/20 bg-bg px-3 py-2 text-sm text-text transition-colors outline-none focus:border-main"
                      />
                      <button
                        type="button"
                        onClick={handleDevLogin}
                        disabled={devLoggingIn()}
                        class="rounded-lg bg-main px-4 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-80 disabled:opacity-50"
                      >
                        {devLoggingIn() ? "..." : "Kirish"}
                      </button>
                    </div>
                    <Show when={devLoginFeedback()}>
                      <p class="mt-1 text-xs text-error">
                        {devLoginFeedback()}
                      </p>
                    </Show>
                  </div>
                </Show>
              </div>
            </div>

            <div class="mt-12 w-full max-w-3xl rounded-2xl border border-main/10 bg-main/5 px-8 py-6 text-center shadow-lg shadow-main/5 backdrop-blur-md">
              <p class="text-sm leading-relaxed text-sub">
                Tizimga kirish yoki ro&apos;yxatdan o&apos;tish orqali siz
                TypeX.uz platformasining qoidalariga rozi bo&apos;lasiz:
              </p>
              <div class="mt-6 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="/privacy-policy"
                  router-link
                  class="group flex items-center gap-3 rounded-xl border border-sub/10 bg-sub/5 py-2 pr-5 pl-2 text-sm font-semibold text-sub transition-all hover:-translate-y-0.5 hover:border-main/30 hover:bg-main/5 hover:text-main"
                >
                  <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-bg text-[10px] text-sub shadow-sm transition-colors group-hover:bg-main/15 group-hover:text-main">
                    <Fa icon="fa-shield-alt" />
                  </span>
                  Maxfiylik
                </a>
                <a
                  href="/terms-of-service"
                  router-link
                  class="group flex items-center gap-3 rounded-xl border border-sub/10 bg-sub/5 py-2 pr-5 pl-2 text-sm font-semibold text-sub transition-all hover:-translate-y-0.5 hover:border-main/30 hover:bg-main/5 hover:text-main"
                >
                  <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-bg text-[10px] text-sub shadow-sm transition-colors group-hover:bg-main/15 group-hover:text-main">
                    <Fa icon="fa-file-contract" />
                  </span>
                  Shartlar
                </a>
                <a
                  href="/security-policy"
                  router-link
                  class="group flex items-center gap-3 rounded-xl border border-sub/10 bg-sub/5 py-2 pr-5 pl-2 text-sm font-semibold text-sub transition-all hover:-translate-y-0.5 hover:border-main/30 hover:bg-main/5 hover:text-main"
                >
                  <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-bg text-[10px] text-sub shadow-sm transition-colors group-hover:bg-main/15 group-hover:text-main">
                    <Fa icon="fa-lock" />
                  </span>
                  Xavfsizlik
                </a>
              </div>
            </div>
          </div>
        }
      >
        <div class="grid h-full place-items-center">
          <p>
            Login/Signup is disabled or the server is down/under maintenance.
          </p>
        </div>
      </Show>
    </Page>
  );
}

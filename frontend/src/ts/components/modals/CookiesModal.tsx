import { createEffect, createSignal, JSXElement } from "solid-js";

import { getAcceptedCookies, setAcceptedCookies } from "../../cookies";
import { hideModal, isModalOpen } from "../../states/modals";
import { cn } from "../../utils/cn";
import { AnimatedModal } from "../common/AnimatedModal";
import { AnimeSwitch } from "../common/anime";
import { AnimeMatch } from "../common/anime/AnimeMatch";
import { Button } from "../common/Button";
import { H2 } from "../common/Headers";

export function CookiesModal(): JSXElement {
  const [showSettings, setShowSettings] = createSignal(false);
  const [accepted, setAccepted] = createSignal(
    getAcceptedCookies() ?? {
      security: true,
      analytics: false,
      sentry: false,
    },
  );
  const [guestName, setGuestName] = createSignal(
    localStorage.getItem("guest_name") ?? "",
  );

  createEffect(() => {
    if (!isModalOpen("Cookies")) {
      setShowSettings(false);
      setAccepted({
        security: true,
        analytics: false,
        sentry: false,
      });
    }
  });

  return (
    <AnimatedModal
      id="Cookies"
      modalClass="max-w-[500px]"
      wrapperClass="justify-end items-end"
      closeOnEscape={false}
      closeOnWrapperClick={false}
    >
      <H2
        text="Aytgancha, biz cookie fayllaridan foydalanamiz"
        fa={{ icon: "fa-cookie-bite" }}
        class="mb-0 pb-0 text-2xl"
      />
      <AnimeSwitch
        exitBeforeEnter
        animeProps={{
          initial: {
            opacity: 0,
            duration: 125,
          },
          animate: {
            opacity: 1,
            duration: 125,
          },
          exit: {
            opacity: 0,
            duration: 125,
          },
        }}
      >
        <AnimeMatch when={!showSettings()}>
          <div class="grid gap-4">
            <div>
              Cookies enhance your experience and help us improve our website.
            </div>

            <div class="mb-4">
              <label class="mb-1 block text-sm font-medium text-text">
                Leaderboard uchun ism (Ixtiyoriy)
              </label>
              <input
                type="text"
                value={guestName()}
                onInput={(e) => setGuestName(e.currentTarget.value)}
                placeholder="Ismingizni kiriting"
                class="w-full rounded-xl bg-sub-alt p-3 text-sm text-text ring-1 ring-sub/20 outline-none focus:ring-main"
                maxLength={20}
              />
              <p class="mt-1 text-xs text-sub">
                Ro&apos;yxatdan o&apos;tmagan bo&apos;lsangiz ham natijangiz
                reytingda shu ism bilan ko&apos;rinadi.
              </p>
            </div>

            <div class="grid gap-2">
              <Button
                text="barchasini qabul qilish"
                active={true}
                onClick={() => {
                  setAccepted({
                    security: true,
                    analytics: true,
                    sentry: true,
                  });
                  setAcceptedCookies(accepted());
                  if (guestName().trim() !== "") {
                    localStorage.setItem("guest_name", guestName().trim());
                  }
                  hideModal("Cookies");
                }}
              />
              <Button
                text="keraksizlarini rad etish"
                onClick={() => {
                  setAccepted({
                    security: true,
                    analytics: false,
                    sentry: false,
                  });
                  setAcceptedCookies(accepted());
                  if (guestName().trim() !== "") {
                    localStorage.setItem("guest_name", guestName().trim());
                  }
                  hideModal("Cookies");
                }}
              />
              <Button
                text="ko'proq sozlamalar"
                onClick={() => setShowSettings(true)}
              />
            </div>
          </div>
        </AnimeMatch>
        <AnimeMatch when={showSettings()}>
          <div class="grid gap-4">
            <SettingsSection
              title="security"
              description={
                <div>
                  We use Cloudflare cookies to improve security and performance
                  of our site. They do not store any personal information and
                  are required.
                </div>
              }
              checked={true}
              disabled={true}
            />
            <SettingsSection
              title="analytics"
              description="We use Google Analytics to track the overall traffic and
            demographics of our site."
              checked={false}
              onChange={(checked) =>
                setAccepted({ ...accepted(), analytics: checked })
              }
            />
            <SettingsSection
              title="sentry"
              description="We use Sentry to track errors and performance issues on our site, as
            well as record anonymized user sessions to help us debug issues and
            improve experience."
              checked={false}
              onChange={(checked) =>
                setAccepted({ ...accepted(), sentry: checked })
              }
            />

            <Button
              text="tanlanganlarni qabul qilish"
              onClick={() => {
                setAcceptedCookies(accepted());
                if (guestName().trim() !== "") {
                  localStorage.setItem("guest_name", guestName().trim());
                }
                hideModal("Cookies");
              }}
            />
          </div>
        </AnimeMatch>
      </AnimeSwitch>
    </AnimatedModal>
  );
}

function SettingsSection(props: {
  title: string;
  description: string | JSXElement;
  checked: boolean;
  disabled?: boolean;
  hideCheckbox?: boolean;
  onChange?: (checked: boolean) => void;
}): JSXElement {
  return (
    <label
      class={cn(
        "grid grid-cols-[auto_1fr] items-center gap-2",
        props.hideCheckbox && "grid-cols-1",
      )}
    >
      <div class="grid gap-1">
        <div class="text-sub">{props.title}</div>
        <div class="text-text">{props.description}</div>
      </div>
      <input
        type="checkbox"
        class="text-2xl"
        checked={props.checked}
        disabled={props.disabled}
        hidden={props.hideCheckbox}
        onChange={(e) => props.onChange?.(e.currentTarget.checked)}
      />
    </label>
  );
}

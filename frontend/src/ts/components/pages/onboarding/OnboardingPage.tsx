// oxlint-disable react/no-unescaped-entities, solid/self-closing-comp
import { createForm } from "@tanstack/solid-form";
import { For, JSXElement, Show, createSignal } from "solid-js";

import Ape from "../../../ape";
import {
  showErrorNotification,
  showNoticeNotification,
} from "../../../states/notifications";
import { Fa } from "../../common/Fa";
import { Page } from "../../common/Page";
import { InputField } from "../../ui/form/InputField";
import { SelectField } from "../../ui/form/SelectField";
import { SubmitButton } from "../../ui/form/SubmitButton";
import { navigate } from "../../../controllers/route-controller";

const AVATARS = [
  "fa-user-astronaut",
  "fa-user-ninja",
  "fa-user-tie",
  "fa-user-graduate",
  "fa-user-secret",
  "fa-user-alt",
  "fa-user-nurse",
  "fa-user-shield",
  "fa-crown",
  "fa-dragon",
  "fa-paw",
  "fa-rocket",
];

export function OnboardingPage(): JSXElement {
  const [selectedAvatar, setSelectedAvatar] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  const missingFields = (): boolean => true;

  const form = createForm(() => ({
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "",
      age: "" as string | number,
    },
    onSubmit: async ({ value }) => {
      setSaving(true);
      try {
        const body: Record<string, unknown> = {};
        if (value.firstName) body["firstName"] = value.firstName;
        if (value.lastName) body["lastName"] = value.lastName;
        if (value.gender) body["gender"] = value.gender;
        if (value.age !== "" && value.age !== undefined) {
          body["age"] = Number(value.age);
        }
        const av = selectedAvatar();
        if (av) body["avatar"] = av;

        if (Object.keys(body).length > 0) {
          const res = await Ape.users.updateProfileDetails({ body });
          if (res.status !== 200) {
            showErrorNotification("Profilni saqlashda xatolik yuz berdi");
            return;
          }
        }

        localStorage.setItem("typeuz_onboarding_done", "true");
        void navigate("/");
      } catch (e) {
        showErrorNotification(`Xatolik: ${(e as Error).message}`);
      } finally {
        setSaving(false);
      }
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Iltimos, maydonlarni to'g'ri to'ldiring");
    },
  }));

  return (
    <Page id="onboarding">
      <div class="mx-auto flex max-w-4xl flex-col items-center gap-8 py-20">
        <div class="flex h-20 w-20 items-center justify-center rounded-full bg-main/10 text-5xl text-main">
          <Fa icon="fa-keyboard" />
        </div>
        <h1 class="text-4xl font-bold text-text">TypeUZga xush kelibsiz!</h1>
        <p class="max-w-lg text-center text-base leading-relaxed text-sub">
          Yozuv tezligingizni oshirish, natijalaringizni saqlash va boshqa
          foydalanuvchilar bilan bellashish uchun tayyormisiz?
        </p>

        <div class="flex w-full max-w-lg flex-col gap-4">
          <div class="flex items-start gap-4 rounded-2xl border border-sub/10 bg-bg/50 p-5 text-left">
            <div class="mt-0.5 text-main">
              <Fa icon="fa-tachometer-alt" />
            </div>
            <div>
              <h3 class="font-semibold text-text">Tezlikni o'lchash</h3>
              <p class="mt-1 text-sm text-sub">
                WPM, aniqlik, vaqt va boshqa ko'rsatkichlarni real vaqtda kuzating
              </p>
            </div>
          </div>
          <div class="flex items-start gap-4 rounded-2xl border border-sub/10 bg-bg/50 p-5 text-left">
            <div class="mt-0.5 text-main">
              <Fa icon="fa-chart-line" />
            </div>
            <div>
              <h3 class="font-semibold text-text">Statistika va reyting</h3>
              <p class="mt-1 text-sm text-sub">
                Barcha natijalaringiz profilingizda saqlanadi va reytingda o'rningizni ko'rasiz
              </p>
            </div>
          </div>
          <div class="flex items-start gap-4 rounded-2xl border border-sub/10 bg-bg/50 p-5 text-left">
            <div class="mt-0.5 text-main">
              <Fa icon="fa-language" />
            </div>
            <div>
              <h3 class="font-semibold text-text">3 tilda test</h3>
              <p class="mt-1 text-sm text-sub">
                O'zbek, ingliz va rus tillarida yozuv tezligi testini topshirishingiz mumkin
              </p>
            </div>
          </div>
        </div>

        <Show when={missingFields()}>
          <div class="w-full max-w-lg">
            <div class="mb-4 flex items-center gap-2">
              <Fa icon="fa-pen-square" class="text-main" />
              <h2 class="text-lg font-semibold text-text">Profilingizni to'ldiring</h2>
              <span class="text-xs text-sub/60">(ixtiyoriy)</span>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void form.handleSubmit();
              }}
              class="flex flex-col gap-4"
            >
              <div class="grid grid-cols-2 gap-3">
                <form.Field
                  name="firstName"
                  children={(field) => (
                    <InputField
                      field={field}
                      placeholder="ism"
                      autocomplete="given-name"
                    />
                  )}
                />
                <form.Field
                  name="lastName"
                  children={(field) => (
                    <InputField
                      field={field}
                      placeholder="familiya"
                      autocomplete="family-name"
                    />
                  )}
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <form.Field
                  name="gender"
                  children={(field) => (
                    <SelectField
                      field={field}
                      label="jinsi"
                      placeholder="tanlang"
                      options={[
                        { value: "male", label: "erkak" },
                        { value: "female", label: "ayol" },
                        { value: "other", label: "boshqa" },
                      ]}
                    />
                  )}
                />
                <form.Field
                  name="age"
                  children={(field) => (
                    <InputField
                      field={field}
                      placeholder="yosh"
                      type="number"
                      autocomplete="off"
                    />
                  )}
                />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-sub">avatar</label>
                <div class="grid grid-cols-6 gap-1.5">
                  <For each={AVATARS}>
                    {(icon) => (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAvatar(
                            selectedAvatar() === icon ? "" : icon,
                          )
                        }
                        class={`flex items-center justify-center rounded-xl p-2 text-lg transition-all ${
                          selectedAvatar() === icon
                            ? "bg-main text-bg shadow-md"
                            : "bg-sub-alt text-text hover:bg-sub"
                        }`}
                      >
                        <Fa icon={icon as never} />
                      </button>
                    )}
                  </For>
                </div>
              </div>
              <div class="flex flex-col gap-3">
                <SubmitButton
                  form={form}
                  fa={{ icon: "fa-check" }}
                  text={saving() ? "Saqlanmoqda..." : "Saqlash va davom etish"}
                  disabled={saving()}
                />
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("typeuz_onboarding_done", "true");
                    void navigate("/");
                  }}
                  class="text-sm text-sub/60 transition-colors hover:text-text"
                >
                  Hozircha tashlab ketish
                </button>
              </div>
            </form>
          </div>
        </Show>

        <button
          type="button"
          onClick={() => {
            localStorage.setItem("typeuz_onboarding_done", "true");
            void navigate("/");
          }}
          class="inline-flex items-center gap-2 rounded-full bg-main px-10 py-4 text-base font-semibold text-bg transition-all hover:scale-105 hover:shadow-lg hover:shadow-main/25"
        >
          Boshlaymiz!
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path style={{ "stroke-linecap": "round", "stroke-linejoin": "round", "stroke-width": "2.5" }} d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </Page>
  );
}

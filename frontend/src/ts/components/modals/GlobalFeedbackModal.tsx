import { createForm } from "@tanstack/solid-form";
import { createSignal, Show } from "solid-js";
import Ape from "../../ape";
import { hideLoaderBar, showLoaderBar } from "../../states/loader-bar";
import { hideModal } from "../../states/modals";
import {
  showErrorNotification,
  showNoticeNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { AnimatedModal } from "../common/AnimatedModal";
import { LabeledField } from "../ui/form/LabeledField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { TextareaField } from "../ui/form/TextareaField";
import { InputField } from "../ui/form/InputField";
import { allFieldsMandatory } from "../ui/form/utils";
import { Fa } from "../common/Fa";

export function GlobalFeedbackModal() {
  const [imageFile, setImageFile] = createSignal<File | null>(null);
  const [imagePreview, setImagePreview] = createSignal<string | null>(null);

  const form = createForm(() => ({
    defaultValues: {
      title: "",
      description: "",
    },
    onSubmit: async ({ value }) => {
      await submitFeedback(value.title, value.description, imagePreview());
      form.reset();
      setImageFile(null);
      setImagePreview(null);
    },
    onSubmitInvalid: () => {
      showNoticeNotification("Barcha qatorlarni to'ldiring");
    },
    validators: {
      onChange: allFieldsMandatory(),
    },
  }));

  const handleImageUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      if (!file.type.startsWith("image/")) {
        showErrorNotification("Faqat rasm yuklash mumkin");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showErrorNotification("Rasm hajmi 5MB dan oshmasligi kerak");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <AnimatedModal
      modalClass="max-w-xl"
      id="GlobalFeedback"
      mode="dialog"
      title="Fikr bildirish / Shikoyat"
    >
      <p class="text-sm text-sub mb-4">
        Saytdagi xatoliklar, takliflar yoki shikoyatlar haqida xabar bering. Barcha xabarlar ma'muriyatga yuboriladi.
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
          name="title"
          children={(field) => (
            <LabeledField label="Sarlavha">
              <InputField
                field={field}
                autocomplete="off"
                placeholder="Xatolik yoki taklif haqida qisqacha"
                class="w-full"
              />
            </LabeledField>
          )}
        />

        <form.Field
          name="description"
          children={(field) => (
            <LabeledField label="Batafsil izoh">
              <div class="relative">
                <TextareaField
                  field={field}
                  class="bg-bg-secondary min-h-32 w-full rounded p-2 text-text"
                  autocomplete="off"
                  placeholder="Muammoni yoki taklifingizni batafsil tushuntiring..."
                />
                <div
                  class={`absolute right-2 bottom-2 text-xs ${500 - field().state.value.length < 0 ? "text-error" : "text-sub"}`}
                >
                  {500 - field().state.value.length}
                </div>
              </div>
            </LabeledField>
          )}
        />

        <LabeledField label="Rasm / Skrinshot (ixtiyoriy)">
          <div class="flex items-center gap-4">
            <label class="cursor-pointer flex items-center justify-center gap-2 rounded-md bg-sub-alt/30 hover:bg-sub-alt/60 px-4 py-2 transition-all">
              <Fa icon="fa-image" class="text-sub" />
              <span class="text-sm font-semibold text-text">Rasm tanlash</span>
              <input aria-label="Input field"
                type="file"
                accept="image/*"
                class="hidden"
                onChange={handleImageUpload}
              />
            </label>
            <Show when={imageFile()}>
              <span class="text-sm text-sub max-w-[200px] truncate">
                {imageFile()?.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                class="text-error hover:text-error-extra transition-colors"
                title="Rasmni o'chirish"
              >
                <Fa icon="fa-times" />
              </button>
            </Show>
          </div>
          <Show when={imagePreview()}>
            <img
              src={imagePreview()!}
              alt="Preview"
              class="mt-4 max-h-48 rounded-md object-contain border border-sub/10"
            />
          </Show>
        </LabeledField>

        <SubmitButton form={form} text="Yuborish" class="w-full mt-2" />
      </form>
    </AnimatedModal>
  );
}

async function submitFeedback(
  title: string,
  description: string,
  imageBase64: string | null,
): Promise<void> {
  showLoaderBar();
  const response = await Ape.public.submitFeedback({
    body: {
      title,
      description,
      imageBase64: imageBase64 ?? undefined,
    },
  });
  hideLoaderBar();

  if (response.status !== 200) {
    showErrorNotification("Xabar yuborishda xatolik yuz berdi", {
      response: response as never,
    });
    return;
  }

  showSuccessNotification("Xabaringiz muvaffaqiyatli yuborildi. Rahmat!");
  hideModal("GlobalFeedback");
}

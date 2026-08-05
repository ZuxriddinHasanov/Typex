import {
  GithubProfileSchema,
  TwitterProfileSchema,
  UserProfileDetailsSchema,
  WebsiteSchema,
} from "@typeuz/schemas/users";
import { createForm } from "@tanstack/solid-form";
import { For } from "solid-js";

import Ape from "../../ape";
import { getSnapshot, setSnapshot } from "../../db";
import { invalidateMyProfile } from "../../queries/profile";
import { hideModal } from "../../states/modals";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../states/notifications";
import { cn } from "../../utils/cn";
import { Fa } from "../common/Fa";
import { AnimatedModal } from "../common/AnimatedModal";
import { Button } from "../common/Button";
import { UserBadge } from "../common/UserBadge";
import { Checkbox } from "../ui/form/Checkbox";
import { InputField } from "../ui/form/InputField";
import { SubmitButton } from "../ui/form/SubmitButton";
import { TextareaField } from "../ui/form/TextareaField";
import { fromSchema } from "../ui/form/utils";
import { showUpdateNameModal } from "./account-settings/UpdateNameModal";

export function EditProfile() {
  const snapshot = getSnapshot();
  if (snapshot === undefined) {
    throw new Error("missing snapshot in EditProfile");
  }
  const badges = snapshot.inventory?.badges ?? [];
  const form = createForm(() => ({
    defaultValues: {
      bio: snapshot.details?.bio ?? "",
      keyboard: snapshot.details?.keyboard ?? "",
      github: snapshot.details?.socialProfiles?.github ?? "",
      twitter: snapshot.details?.socialProfiles?.twitter ?? "",
      website: snapshot.details?.socialProfiles?.website ?? "",
      showActivityOnPublicProfile:
        snapshot.details?.showActivityOnPublicProfile ?? true,
      badgeId: badges.find((b) => b.selected)?.id ?? -1,
    },
    onSubmit: async ({ value }) => {
      const updates = {
        bio: value.bio,
        keyboard: value.keyboard,
        socialProfiles: {
          twitter: value.twitter,
          github: value.github,
          website: value.website,
        },
        showActivityOnPublicProfile: value.showActivityOnPublicProfile,
      };

      const response = await Ape.users.updateProfile({
        body: {
          ...updates,
          selectedBadgeId: value.badgeId,
        },
      });

      if (response.status !== 200) {
        showErrorNotification("Failed to update profile", { response });
        return;
      }

      const newBadges =
        snapshot.inventory?.badges?.map((it) => ({
          ...it,
          selected: it.id === value.badgeId,
        })) ?? [];

      form.reset(value);
      hideModal("EditProfile");
      setSnapshot({
        ...snapshot,
        details: response.body.data ?? updates,
        inventory: { ...snapshot.inventory, badges: newBadges },
      });
      void invalidateMyProfile();
      showSuccessNotification("Profile updated");
    },
  }));

  return (
    <AnimatedModal
      id="EditProfile"
      title="Edit Profile"
      modalClass="max-w-[600px]"
    >
      <form
        class="flex flex-col gap-6 p-2"
        onSubmit={(e) => {
          e.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold tracking-wide text-sub uppercase">Ism</label>
          <div class="flex items-center gap-3">
            <span class="text-lg font-bold text-text">{snapshot.name}</span>
            <Button onClick={() => showUpdateNameModal()} class="px-3 py-1.5 rounded-lg bg-sub-alt/50 hover:bg-main/20 hover:text-main transition-colors">
              <Fa icon="fa-pen" /> O&apos;zgartirish
            </Button>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold tracking-wide text-sub uppercase">Bio</label>
          <form.Field
            name="bio"
            validators={{
              onChange: fromSchema(UserProfileDetailsSchema.shape.bio),
            }}
          >
            {(field) => (
              <>
                <TextareaField field={field} maxLength={250} />
                <div class="mt-1 text-base">
                  {field().state.value.length}/250
                </div>
              </>
            )}
          </form.Field>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold tracking-wide text-sub uppercase">Klaviatura</label>
          <form.Field
            name="keyboard"
            validators={{
              onChange: fromSchema(UserProfileDetailsSchema.shape.keyboard),
            }}
          >
            {(field) => (
              <>
                <TextareaField field={field} maxLength={75} />
                <div class="mt-1 text-xs text-sub/70">
                  {field().state.value.length}/75
                </div>
              </>
            )}
          </form.Field>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold tracking-wide text-sub uppercase">GitHub</label>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <p class="text-sub font-mono text-sm whitespace-nowrap">https://github.com/</p>
            <div class="w-full">
              <form.Field
                name="github"
                validators={{
                  onChange: fromSchema(GithubProfileSchema),
                }}
              >
                {(field) => (
                  <InputField
                    field={field}
                    class="github w-full"
                    type="text"
                    maxLength={39}
                  />
                )}
              </form.Field>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold tracking-wide text-sub uppercase">Twitter / X</label>
          <div class="flex flex-col sm:flex-row sm:items-center gap-2">
            <p class="text-sub font-mono text-sm whitespace-nowrap">https://x.com/</p>
            <div class="w-full">
              <form.Field
                name="twitter"
                validators={{
                  onChange: fromSchema(TwitterProfileSchema),
                }}
              >
                {(field) => (
                  <InputField
                    field={field}
                    class="twitter w-full"
                    type="text"
                    maxLength={15}
                  />
                )}
              </form.Field>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold tracking-wide text-sub uppercase">Vebsayt</label>
          <form.Field
            name="website"
            validators={{
              onChange: fromSchema(WebsiteSchema),
            }}
          >
            {(field) => (
              <InputField
                field={field}
                class="website w-full"
                type="text"
                maxLength={200}
              />
            )}
          </form.Field>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold tracking-wide text-sub uppercase">Nishon</label>
          <form.Field name="badgeId">
            {(field) => (
              <div class="flex flex-wrap gap-2">
                <For each={[{ id: -1 }, ...badges]}>
                  {(badge) => (
                    <Button
                      class={cn("p-0 rounded-lg transition-all border-2", {
                        "border-main bg-main/10 shadow-sm opacity-100": field().state.value === badge.id,
                        "border-transparent opacity-50 hover:bg-sub-alt hover:opacity-100": field().state.value !== badge.id,
                      })}
                      onClick={() => field().handleChange(badge.id)}
                    >
                      <UserBadge
                        id={badge.id}
                        class="p-2 text-xl"
                        hideDescription
                      />
                    </Button>
                  )}
                </For>
              </div>
            )}
          </form.Field>
        </div>

        <div class="flex flex-col gap-1.5 pt-2 border-t border-sub/10">
          <label class="text-sm font-semibold tracking-wide text-sub uppercase">Ommaviy faollik</label>
          <form.Field name="showActivityOnPublicProfile">
            {(field) => (
              <Checkbox
                field={field}
                label="Ommaviy profilda test faollik grafigini ko'rsatish"
              />
            )}
          </form.Field>
        </div>

        <div class="pt-4 flex justify-end">
          <SubmitButton form={form} class="px-6 py-2.5 rounded-full font-bold text-sm bg-main text-bg hover:scale-105 transition-transform">
            Saqlash
          </SubmitButton>
        </div>
      </form>
    </AnimatedModal>
  );
}

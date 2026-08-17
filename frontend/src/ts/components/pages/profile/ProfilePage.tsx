import { useQuery } from "@tanstack/solid-query";
import { createEffect, JSXElement, Show } from "solid-js";

import { PageName } from "../../../pages/page";
import { getUserProfile } from "../../../queries/profile";
import { getActivePage, getSelectedProfileName } from "../../../states/core";
import AsyncContent from "../../common/AsyncContent";
import { Fa } from "../../common/Fa";
import { Page } from "../../common/Page";
import { UserProfile } from "./UserProfile";

const pageName: PageName = "profile";
export function ProfilePage(): JSXElement {
  const isOpen = () => getActivePage() === pageName;

  const profileQuery = useQuery(() => ({
    ...getUserProfile(getSelectedProfileName() as string),
    enabled: isOpen() && getSelectedProfileName() !== undefined,
  }));

  createEffect(() => {
    console.log("ProfilePage reactive effect:", {
      isOpen: isOpen(),
      name: getSelectedProfileName(),
      loading: profileQuery.isLoading,
      error: profileQuery.isError,
      data: profileQuery.data !== undefined,
    });
  });

  return (
    <Page id="profile">
      <div class="flex flex-col gap-8">
        <AsyncContent queries={{ profileQuery }} ignoreError={true}>
          {({ profileQueryData }) => (
            <UserProfile profile={profileQueryData()} />
          )}
        </AsyncContent>
        <Show when={profileQuery.isError}>
          <div class="flex items-baseline justify-center gap-2 text-lg text-error">
            <Fa icon="fa-times" />
            <span>User {getSelectedProfileName()} not found</span>
          </div>
        </Show>
      </div>
    </Page>
  );
}

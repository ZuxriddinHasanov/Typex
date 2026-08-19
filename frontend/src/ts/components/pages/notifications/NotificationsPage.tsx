import { JSXElement, onCleanup } from "solid-js";
import { Page } from "../../common/Page";
import { Fa } from "../../common/Fa";
import { Inbox } from "../../popups/alerts/Inbox";
import { Psas } from "../../popups/alerts/Psas";
import { NotificationHistory } from "../../popups/alerts/NotificationHistory";
import { applyPendingInboxActions } from "../../../collections/inbox";

function Separator(): JSXElement {
  return <div class="h-1 rounded bg-sub-alt my-4"></div>;
}

export function NotificationsPage(): JSXElement {
  onCleanup(() => {
    applyPendingInboxActions();
  });

  return (
    <Page id="notifications">
      <div class="animate-fade-in-up mx-auto w-full max-w-3xl">
        <div class="mb-8 flex items-center gap-4">
          <a
            href="/account"
            router-link
            class="flex items-center gap-2 rounded-full bg-sub-alt/40 px-4 py-2 text-sm font-bold text-text hover:bg-sub-alt"
          >
            <Fa icon="fa-arrow-left" />
            Orqaga
          </a>
          <h1 class="text-3xl font-black tracking-tight text-text">
            Bildirishnomalar
          </h1>
        </div>

        <div class="rounded-2xl border border-sub/5 bg-gradient-to-b from-sub-alt/40 to-bg p-6 shadow-sm backdrop-blur-sm">
          <Inbox />
          <Separator />
          <Psas />
          <Separator />
          <NotificationHistory />
        </div>
      </div>
    </Page>
  );
}

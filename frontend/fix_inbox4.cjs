const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/collections/inbox.ts", "utf8");

const replacement = `export async function refetchInboxCollection(): Promise<void> {
  try {
    const response = await Ape.users.getInbox();
    if (response.status === 200) {
      const data = response.body.data.inbox;
      
      const hasUnread = data.some(it => !it.read);
      const unreadCount = data.filter(it => !it.read).length;
      
      setHasUnreadInbox(hasUnread);
      setUnreadInboxCount(unreadCount);
      
      // Also update the React Query cache so the Notifications page has fresh data
      queryClient.setQueryData(queryKeys.root(), data);
      
      // Let's also check if we need to show the toast
      if (lastKnownInboxIds.size > 0) {
        let hasNew = false;
        for (const item of data) {
          if (!lastKnownInboxIds.has(item.id)) {
            hasNew = true;
          }
        }
        if (hasNew) {
          showSuccessNotification(
            "Sizga yangi xabar keldi! Inboxni tekshiring.",
            {
              customTitle: "Yangi xabar", customIcon: "envelope", durationMs: 8000, important: true,
              onDismiss: (reason) => { if (reason === 'click') { void navigate('/notifications'); } },
            },
          );
        }
      }
      
      lastKnownInboxIds.clear();
      data.forEach((item) => lastKnownInboxIds.add(item.id));
    }
  } catch (e) {
    console.error("Failed to fetch inbox manually:", e);
  }
}`;

code = code.replace(
  /export async function refetchInboxCollection\(\): Promise<void> \{[\s\S]*?\}\n\nconst inboxItemIdsToClaim/,
  replacement + "\n\nconst inboxItemIdsToClaim",
);

fs.writeFileSync("frontend/src/ts/collections/inbox.ts", code);

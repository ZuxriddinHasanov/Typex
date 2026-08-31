const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/collections/inbox.ts", "utf8");

const replacement = `export async function refetchInboxCollection(): Promise<void> {
  try {
    const response = await Ape.users.getInbox();
    if (response.status === 200) {
      const rawData = response.body.data.inbox;
      
      const addStatus = (item) => ({
        ...item,
        status: item.rewards.length > 0 && !item.read ? "unclaimed" : item.read ? "read" : "unread",
      });
      const data = rawData.map(addStatus);
      
      const hasUnread = data.some(it => it.status === "unread" || it.status === "unclaimed");
      const unreadCount = data.filter(it => it.status === "unread" || it.status === "unclaimed").length;
      
      setHasUnreadInbox(hasUnread);
      setUnreadInboxCount(unreadCount);
      
      queryClient.setQueryData(queryKeys.root(), data);
      
      if (lastKnownInboxIds.size > 0) {
        let hasNew = false;
        for (const item of data) {
          if (!lastKnownInboxIds.has(item.id)) {
            hasNew = true;
          }
        }
        if (hasNew) {
          showSuccessNotification("Sizga yangi xabar keldi! Inboxni tekshiring.", {
            customTitle: "Yangi xabar", customIcon: "envelope", durationMs: 8000, important: true,
            onDismiss: (reason) => { if (reason === 'click') { void navigate('/notifications'); } },
          });
        }
      }
      
      lastKnownInboxIds.clear();
      data.forEach((item) => lastKnownInboxIds.add(item.id));
    }
  } catch (e) {
    console.error("Failed to fetch inbox manually:", e);
  }
}`;

const idx1 = code.indexOf(
  "export async function refetchInboxCollection(): Promise<void> {",
);
const idx2 = code.indexOf("const inboxItemIdsToClaim: string[] = [];");

if (idx1 !== -1 && idx2 !== -1) {
  code = code.substring(0, idx1) + replacement + "\n\n" + code.substring(idx2);
  fs.writeFileSync("frontend/src/ts/collections/inbox.ts", code);
  console.log("REPLACED");
} else {
  console.log("NOT FOUND", idx1, idx2);
}

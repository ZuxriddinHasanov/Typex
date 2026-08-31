const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/collections/inbox.ts", "utf8");
code = code.replace(
  /export async function refetchInboxCollection\(\): Promise<void> \{[\s\S]*?\}\n\nconst inboxItemIdsToClaim/,
  `export async function refetchInboxCollection(): Promise<void> {
  // Use fetchQuery to force executing the queryFn even if unobserved.
  // This will trigger the notification toast and update the dots.
  await queryClient.fetchQuery({ queryKey: queryKeys.root() });
}

const inboxItemIdsToClaim`,
);
fs.writeFileSync("frontend/src/ts/collections/inbox.ts", code);

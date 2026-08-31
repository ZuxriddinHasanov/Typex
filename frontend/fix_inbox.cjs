const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/collections/inbox.ts", "utf8");
code = code.replace(
  /export async function refetchInboxCollection\(\): Promise<void> \{\s*await inboxCollection\.utils\.refetch\(\);\s*\}/,
  `export async function refetchInboxCollection(): Promise<void> {
  // Use fetchQuery to force a fetch and update the cache even if unobserved
  await queryClient.fetchQuery({ 
    queryKey: queryKeys.root(), 
    // @ts-ignore
    queryFn: inboxCollection.options.queryFn 
  });
}`,
);
fs.writeFileSync("frontend/src/ts/collections/inbox.ts", code);

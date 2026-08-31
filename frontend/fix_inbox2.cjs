const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/collections/inbox.ts", "utf8");
code = code.replace(
  /export async function refetchInboxCollection\(\): Promise<void> \{[\s\S]*?\}/,
  `export async function refetchInboxCollection(): Promise<void> {
  const response = await Ape.users.getInbox();
  if (response.status === 200) {
    const data = response.body.data.inbox;
    setHasUnreadInbox(data.some(it => !it.read));
    setUnreadInboxCount(data.filter(it => !it.read).length);
    queryClient.invalidateQueries({ queryKey: queryKeys.root() });
  }
}`,
);
fs.writeFileSync("frontend/src/ts/collections/inbox.ts", code);

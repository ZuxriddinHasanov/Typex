const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/collections/inbox.ts", "utf8");
code = code.replace(
  /queryClient\.invalidateQueries\(\{ queryKey: queryKeys\.root\(\) \}\);\s*\}\s*\}\s*\}\s*const inboxItemIdsToClaim/,
  "queryClient.invalidateQueries({ queryKey: queryKeys.root() });\n  }\n}\n\nconst inboxItemIdsToClaim",
);
fs.writeFileSync("frontend/src/ts/collections/inbox.ts", code);

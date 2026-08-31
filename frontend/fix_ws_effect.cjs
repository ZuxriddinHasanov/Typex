const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/collections/inbox.ts", "utf8");

code = code.replace(
  /import \{ Accessor, createSignal \} from "solid-js";/,
  'import { Accessor, createSignal, createRoot, createEffect } from "solid-js";',
);

code = code.replace(
  /if \(typeof window !== 'undefined'\) \{ initWs\(\); setTimeout\(\(\) => \{ if \(isAuthenticated\(\)\) refetchInboxCollection\(\)\.catch\(console\.error\); \}, 1000\); \}/,
  `
if (typeof window !== 'undefined') {
  createRoot(() => {
    createEffect(() => {
      if (isAuthenticated()) {
        initWs();
        refetchInboxCollection().catch(console.error);
      } else {
        if (ws) {
          ws.close();
          ws = null;
        }
      }
    });
  });
}`,
);

fs.writeFileSync("frontend/src/ts/collections/inbox.ts", code);

const fs = require("fs");
let code = fs.readFileSync(
  "frontend/src/ts/components/pages/leaderboard/Title.tsx",
  "utf8",
);

code = code.replace(
  /const type =[\s\S]*?;\n\n    const friend/,
  `const type = props.selection.type === "allTime" ? "Barcha vaqtlar" : props.selection.type === "weekly" ? "Haftalik" : "Kunlik";\n\n    const friend`,
);

fs.writeFileSync(
  "frontend/src/ts/components/pages/leaderboard/Title.tsx",
  code,
);

const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/test/result.ts", "utf8");

code = code.replace(
  /import anime from "animejs";/g,
  'import { animate } from "animejs";',
);
code = code.replace(/anime\(\{/g, "animate(obj, {");
// Wait, anime({ targets: obj, value: result.wpm }) becomes animate(obj, { value: result.wpm })!
// Let's replace the whole blocks!

code = code.replace(
  /anime\(\{\s*targets: obj,\s*value/g,
  "animate(obj, {\n        value",
);
fs.writeFileSync("frontend/src/ts/test/result.ts", code);

const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/test/result.ts", "utf8");

code = code.replace(
  /anime\(\{\s*targets: obj,\s*value/g,
  "animate(obj, {\n        value",
);
code = code.replace(/anime\(\{/g, "animate(obj, {");

fs.writeFileSync("frontend/src/ts/test/result.ts", code);

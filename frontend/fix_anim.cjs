const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/test/result.ts", "utf8");

code = code.replace(
  /await Misc.promiseAnimate\("#result", \{\s*opacity: \[0, 1\],\s*translateY: \[30, 0\],\s*easing: "easeOutCubic",\s*duration: Misc.applyReducedMotion\(500\),\s*\}\);/g,
  `await Misc.promiseAnimate("#result", {
      opacity: [0, 1],
      translateY: [40, 0],
      scale: [0.98, 1],
      easing: "easeOutExpo",
      duration: Misc.applyReducedMotion(1000),
    });`,
);

fs.writeFileSync("frontend/src/ts/test/result.ts", code);

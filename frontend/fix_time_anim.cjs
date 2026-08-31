const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/test/result.ts", "utf8");

const replacement = `    } else {
      const timeEl = qs("#result .stats .time .bottom .text");
      if (timeEl) {
        const obj = { value: 0 };
        anime({
          targets: obj,
          value: result.testDuration,
          easing: "easeOutExpo",
          duration: 1500,
          update: () => {
            let time = \`\${Math.round(obj.value)}s\`;
            if (obj.value > 61) {
              time = DateTime.secondsToString(Math.round(obj.value));
            }
            timeEl.setText(time);
          }
        });
      }
      qs("#result .stats .time .bottom")?.setAttribute(`;

code = code.replace(
  /    \} else \{\s*let time = `\$\{Math\.round\(result\.testDuration\)\}s`;\s*if \(result\.testDuration > 61\) \{\s*time = DateTime\.secondsToString\(Math\.round\(result\.testDuration\)\);\s*\}\s*qs\("#result \.stats \.time \.bottom \.text"\)\?\.setText\(time\);\s*qs\("#result \.stats \.time \.bottom"\)\?\.setAttribute\(/g,
  replacement,
);

fs.writeFileSync("frontend/src/ts/test/result.ts", code);

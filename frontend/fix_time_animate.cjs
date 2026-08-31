const fs = require("fs");
let code = fs.readFileSync("src/ts/test/result.ts", "utf8");

const replacement = `    } else {
      const timeEl = qs("#result .stats .time .bottom .text");
      if (timeEl) {
        animateNumber(0, result.testDuration, 1500, (val) => {
          let time = \`\${Math.round(val)}s\`;
          if (val > 61) {
            time = DateTime.secondsToString(Math.round(val));
          }
          timeEl.setText(time);
        });
      }
      qs("#result .stats .time .bottom")?.setAttribute(`;

code = code.replace(
  /    \} else \{\s*let time = `\$\{Math\.round\(result\.testDuration\)\}s`;\s*if \(result\.testDuration > 61\) \{\s*time = DateTime\.secondsToString\(Math\.round\(result\.testDuration\)\);\s*\}\s*qs\("#result \.stats \.time \.bottom \.text"\)\?\.setText\(time\);\s*qs\("#result \.stats \.time \.bottom"\)\?\.setAttribute\(/,
  replacement,
);

fs.writeFileSync("src/ts/test/result.ts", code);

const fs = require("fs");
let code = fs.readFileSync("src/ts/test/result.ts", "utf8");

const startIdx = code.indexOf("function updateTime(): void {");
const endIdx = code.indexOf('import { t } from "../states/ui-language";');

if (startIdx !== -1 && endIdx !== -1) {
  const newCode = `function updateTime(): void {
  const afkSecondsPercent = Numbers.roundTo2(
    (result.afkDuration / result.testDuration) * 100 || 0,
  );
  qs("#result .stats .time .bottom .afk")?.setText("");
  if (afkSecondsPercent > 0) {
    qs("#result .stats .time .bottom .afk")?.setText(
      \`\${afkSecondsPercent}% afk\`,
    );
  }
  qs("#result .stats .time .bottom")?.setAttribute(
    "aria-label",
    \`\${result.afkDuration}s afk \${afkSecondsPercent}%\`,
  );

  const timeEl = qs("#result .stats .time .bottom .text");
  if (timeEl) {
    if (Config.alwaysShowDecimalPlaces) {
      animateNumber(0, result.testDuration, 1500, (val) => {
        let time = \`\${Numbers.roundTo2(val).toFixed(2)}s\`;
        if (val > 61) {
          time = DateTime.secondsToString(Numbers.roundTo2(val));
        }
        timeEl.setText(time);
      });
    } else {
      animateNumber(0, result.testDuration, 1500, (val) => {
        let time = \`\${Math.round(val)}s\`;
        if (val > 61) {
          time = DateTime.secondsToString(Math.round(val));
        }
        timeEl.setText(time);
      });
      qs("#result .stats .time .bottom")?.setAttribute(
        "aria-label",
        \`\${Numbers.roundTo2(result.testDuration)}s (\${
          result.afkDuration
        }s afk \${afkSecondsPercent}%)\`,
      );
    }
  }
}

  `;
  code = code.substring(0, startIdx) + newCode + code.substring(endIdx);
  fs.writeFileSync("src/ts/test/result.ts", code);
  console.log("Success!");
} else {
  console.log("Indices not found", startIdx, endIdx);
}

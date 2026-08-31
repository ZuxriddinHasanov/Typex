const fs = require("fs");
let code = fs.readFileSync("src/ts/test/result.ts", "utf8");

code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.wpm,[\s\S]*?wpmEl\.setText\([\s\S]*?\}\);/,
  "animateNumber(0, result.wpm, 1500, (val) => wpmEl.setText(Format.typingSpeed(val)));",
);
code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.rawWpm,[\s\S]*?rawEl\.setText\([\s\S]*?\}\);/,
  "animateNumber(0, result.rawWpm, 1500, (val) => rawEl.setText(Format.typingSpeed(val)));",
);
code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.acc,[\s\S]*?accEl\.setText\([\s\S]*?\}\);/,
  'animateNumber(0, result.acc, 1500, (val) => { const roundVal = Math.round(val); accEl.setText(roundVal === 100 ? "100%" : Format.accuracy(val)); });',
);
code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.consistency,[\s\S]*?consEl\.setText\([\s\S]*?\}\);/,
  "animateNumber(0, result.consistency, 1500, (val) => consEl.setText(Format.percentage(val)));",
);
code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.testDuration,[\s\S]*?timeEl\.setText\(time\);\s*\}\s*,\s*\n\s*\}\);/m,
  `animateNumber(0, result.testDuration, 1500, (val) => {
          let time = \`\${Math.round(val)}s\`;
          if (val > 61) {
            time = DateTime.secondsToString(Math.round(val));
          }
          timeEl.setText(time);
        });`,
);

fs.writeFileSync("src/ts/test/result.ts", code);

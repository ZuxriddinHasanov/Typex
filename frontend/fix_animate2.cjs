const fs = require("fs");
let code = fs.readFileSync("src/ts/test/result.ts", "utf8");

code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.wpm,[\s\S]*?update: \(\) => wpmEl\.setText\(Format\.typingSpeed\(obj\.value\)\)\s*\}\);/,
  "animateNumber(0, result.wpm, 1500, (val) => wpmEl.setText(Format.typingSpeed(val)));",
);

code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.rawWpm,[\s\S]*?update: \(\) => rawEl\.setText\(Format\.typingSpeed\(obj\.value\)\)\s*\}\);/,
  "animateNumber(0, result.rawWpm, 1500, (val) => rawEl.setText(Format.typingSpeed(val)));",
);

code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.acc,[\s\S]*?update: \(\) => accEl\.setText\(obj\.value === 100 \? "100%" : Format\.accuracy\(obj\.value\)\)\s*\}\);/,
  'animateNumber(0, result.acc, 1500, (val) => { const roundVal = Math.round(val); accEl.setText(roundVal === 100 ? "100%" : Format.accuracy(val)); });',
);

code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.consistency,[\s\S]*?update: \(\) => consEl\.setText\(Format\.percentage\(obj\.value\)\)\s*\}\);/,
  "animateNumber(0, result.consistency, 1500, (val) => consEl.setText(Format.percentage(val)));",
);

code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.testDuration,[\s\S]*?timeEl\.setText\(time\);\s*\}\s*\}\);/,
  `animateNumber(0, result.testDuration, 1500, (val) => {
          let time = \`\${Math.round(val)}s\`;
          if (val > 61) {
            time = DateTime.secondsToString(Math.round(val));
          }
          timeEl.setText(time);
        });`,
);

fs.writeFileSync("src/ts/test/result.ts", code);

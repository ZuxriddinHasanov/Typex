const fs = require("fs");
let code = fs.readFileSync("src/ts/test/result.ts", "utf8");

const animateFunc = `function animateNumber(start: number, end: number, duration: number, onUpdate: (val: number) => void) {
  const startTime = performance.now();
  const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  function update(time: number) {
    let elapsed = time - startTime;
    if (elapsed < 0) elapsed = 0;
    let progress = elapsed / duration;
    if (progress > 1) progress = 1;
    const current = start + (end - start) * easeOutExpo(progress);
    onUpdate(current);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

`;

// Insert the animateNumber function before updateWpmAndAcc
code = code.replace(
  /function updateWpmAndAcc\(\): void \{/,
  animateFunc + "function updateWpmAndAcc(): void {",
);

// Now replace all animate(obj, { ... }) calls
// 1. wpm
code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.wpm,\s*easing: "easeOutExpo",\s*duration: 1500,\s*update: \(\) => wpmEl\.setText\(Format\.typingSpeed\(obj\.value\)\)\s*\}\);/,
  "animateNumber(0, result.wpm, 1500, (val) => wpmEl.setText(Format.typingSpeed(val)));",
);

// 2. raw
code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.rawWpm,\s*easing: "easeOutExpo",\s*duration: 1500,\s*update: \(\) => rawEl\.setText\(Format\.typingSpeed\(obj\.value\)\)\s*\}\);/,
  "animateNumber(0, result.rawWpm, 1500, (val) => rawEl.setText(Format.typingSpeed(val)));",
);

// 3. acc
code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.acc,\s*easing: "easeOutExpo",\s*duration: 1500,\s*update: \(\) => accEl\.setText\(obj\.value === 100 \? "100%" : Format\.accuracy\(obj\.value\)\)\s*\}\);/,
  'animateNumber(0, result.acc, 1500, (val) => { const roundVal = Math.round(val); accEl.setText(roundVal === 100 ? "100%" : Format.accuracy(val)); });',
);

// 4. consistency
code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.consistency,\s*easing: "easeOutExpo",\s*duration: 1500,\s*update: \(\) => consEl\.setText\(Format\.percentage\(obj\.value\)\)\s*\}\);/,
  "animateNumber(0, result.consistency, 1500, (val) => consEl.setText(Format.percentage(val)));",
);

// 5. time
code = code.replace(
  /const obj = \{ value: 0 \};\s*animate\(obj, \{\s*value: result\.testDuration,\s*easing: "easeOutExpo",\s*duration: 1500,\s*update: \(\) => \{\s*let time = `\$\{Math\.round\(obj\.value\)\}s`;\s*if \(obj\.value > 61\) \{\s*time = DateTime\.secondsToString\(Math\.round\(obj\.value\)\);\s*\}\s*timeEl\.setText\(time\);\s*\}\s*\}\);/,
  `animateNumber(0, result.testDuration, 1500, (val) => {
          let time = \`\${Math.round(val)}s\`;
          if (val > 61) {
            time = DateTime.secondsToString(Math.round(val));
          }
          timeEl.setText(time);
        });`,
);

fs.writeFileSync("src/ts/test/result.ts", code);

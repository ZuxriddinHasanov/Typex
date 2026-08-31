const fs = require('fs');
let code = fs.readFileSync('src/ts/test/result.ts', 'utf8');

const startStr = "function animateNumber(";
const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf("requestAnimationFrame(update);\n}", startIdx) + "requestAnimationFrame(update);\n}".length;

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `function animateNumber(
  start: number,
  end: number,
  duration: number,
  onUpdate: (val: number) => void,
): void {
  let startTime: number | null = null;
  const easeOutExpo = (t: number): number =>
    t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  function update(time: number): void {
    if (startTime === null) startTime = time;
    let elapsed = time - startTime;
    if (elapsed < 0) elapsed = 0;
    let progress = elapsed / duration;
    if (progress > 1) progress = 1;
    const current = start + (end - start) * easeOutExpo(progress);
    onUpdate(current);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}`;

  code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
  fs.writeFileSync('src/ts/test/result.ts', code);
  console.log("Success");
} else {
  console.log("Not found");
}

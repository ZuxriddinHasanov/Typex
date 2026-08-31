const fs = require('fs');
let code = fs.readFileSync('src/ts/test/result.ts', 'utf8');

const regex = /function animateNumber\(start: number, end: number, duration: number, onUpdate: \(val: number\) => void\): void \{[\s\S]+?\}\n  requestAnimationFrame\(update\);\n\}/m;

const replacement = `function animateNumber(start: number, end: number, duration: number, onUpdate: (val: number) => void): void {
  let startTime: number | null = null;
  const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  function update(time: number): void {
    if (startTime === null) startTime = time;
    let elapsed = time - startTime;
    if (elapsed < 0) elapsed = 0;
    let progress = elapsed / duration;
    if (progress > 1) progress = 1;
    const current = start + (end - start) * easeOutExpo(progress);
    onUpdate(current);
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  requestAnimationFrame(update);
}`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/ts/test/result.ts', code);

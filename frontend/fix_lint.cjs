const fs = require('fs');
let code = fs.readFileSync('src/ts/test/result.ts', 'utf8');

code = code.replace(/import \{ animate \} from "animejs";\n/, '');

code = code.replace(/function animateNumber\(\n  start: number,\n  end: number,\n  duration: number,\n  onUpdate: \(val: number\) => void,\n\) \{/, 'function animateNumber(\n  start: number,\n  end: number,\n  duration: number,\n  onUpdate: (val: number) => void,\n): void {');

code = code.replace(/const easeOutExpo = \(t: number\) => \(t === 1 \? 1 : 1 - Math\.pow\(2, -10 \* t\)\);/, 'const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));');

code = code.replace(/function update\(time: number\) \{/, 'function update(time: number): void {');

fs.writeFileSync('src/ts/test/result.ts', code);

const fs = require('fs');
let code = fs.readFileSync('src/ts/test/result.ts', 'utf8');

code = code.replace(/function animateNumber\(start: number, end: number, duration: number, onUpdate: \(val: number\) => void\) \{/, 'function animateNumber(start: number, end: number, duration: number, onUpdate: (val: number) => void): void {');

code = code.replace(/const easeOutExpo = \(t: number\) => t === 1 \? 1 : 1 - Math\.pow\(2, -10 \* t\);/, 'const easeOutExpo = (t: number): number => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);');

fs.writeFileSync('src/ts/test/result.ts', code);

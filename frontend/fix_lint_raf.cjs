const fs = require('fs');
let code = fs.readFileSync('src/ts/test/result.ts', 'utf8');

code = code.replace(/if \(startTime === null\) startTime = time;/, 'startTime ??= time;');

fs.writeFileSync('src/ts/test/result.ts', code);

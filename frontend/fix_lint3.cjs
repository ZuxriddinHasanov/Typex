const fs = require('fs');
let code = fs.readFileSync('src/ts/test/result.ts', 'utf8');

code = code.replace(/import \{ animate \} from "animejs";\r?\n/, '');

fs.writeFileSync('src/ts/test/result.ts', code);

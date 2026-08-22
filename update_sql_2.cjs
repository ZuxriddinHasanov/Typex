const fs = require('fs');
let content = fs.readFileSync('backend/src/dal/leaderboards.ts', 'utf8');

content = content.replace(
  /WHERE r\.mode = \$2 AND r\.mode2 = \$3/g,
  "WHERE $1 = $1 AND r.mode = $2 AND r.mode2 = $3"
);

fs.writeFileSync('backend/src/dal/leaderboards.ts', content);

const fs = require('fs');
let content = fs.readFileSync('backend/src/dal/leaderboards.ts', 'utf8');

// Replace in getPeriod
content = content.replace(
  "WHERE COALESCE(r.language, 'english') = $1 AND r.mode = $2 AND r.mode2 = $3 AND COALESCE(r.numbers, false) = $4",
  "WHERE r.mode = $2 AND r.mode2 = $3 AND COALESCE(r.numbers, false) = $4"
);

// Replace in getPeriodRank
content = content.replace(
  "WHERE COALESCE(r.language, 'english') = $1 AND r.mode = $2 AND r.mode2 = $3 AND COALESCE(r.numbers, false) = $4",
  "WHERE r.mode = $2 AND r.mode2 = $3 AND COALESCE(r.numbers, false) = $4"
);

// Replace in getPeriodCount
content = content.replace(
  "WHERE COALESCE(r.language, 'english') = $1 AND r.mode = $2 AND r.mode2 = $3 AND COALESCE(r.numbers, false) = $4",
  "WHERE r.mode = $2 AND r.mode2 = $3 AND COALESCE(r.numbers, false) = $4"
);

fs.writeFileSync('backend/src/dal/leaderboards.ts', content);

const fs = require("fs");
const path = "frontend/src/ts/components/pages/admin/AdminUserDetailPage.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /\{formatDate\(new Date\(t\.timestamp\)\)\} \{formatTime\(new Date\(t\.timestamp\)\)\}/g,
  "{new Date(t.timestamp).toLocaleString()}",
);
content = content.replace(
  /\{formatDate\(new Date\(selectedTest\(\)\.timestamp\)\)\} \{formatTime\(new Date\(selectedTest\(\)\.timestamp\)\)\}/g,
  "{new Date(selectedTest().timestamp).toLocaleString()}",
);

fs.writeFileSync(path, content, "utf8");
console.log("Done");

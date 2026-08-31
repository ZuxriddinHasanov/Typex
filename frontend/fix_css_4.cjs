const fs = require("fs");
let code = fs.readFileSync("frontend/src/styles/test.scss", "utf8");

code = code.replace(
  /    \}\n\n#showWordHistoryButton \{/,
  `    }
  }
}

#showWordHistoryButton {`,
);

fs.writeFileSync("frontend/src/styles/test.scss", code);

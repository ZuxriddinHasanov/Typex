const fs = require("fs");
let code = fs.readFileSync(
  "frontend/src/ts/controllers/chart-controller.ts",
  "utf8",
);

code = code.replace(
  /label: "wpm",\s*data: \[\],\s*borderColor: "rgba\(125, 125, 125, 1\)",\s*borderWidth: 3,/g,
  `label: "wpm",
        data: [],
        borderColor: "rgba(125, 125, 125, 1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,`,
);

code = code.replace(
  /options: \{\s*responsive: true,\s*maintainAspectRatio: false,/g,
  `options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
    },`,
);

code = code.replace(
  /const wpm = c\.getDataset\("wpm"\);\s*wpm\.backgroundColor = "transparent";/g,
  `const wpm = c.getDataset("wpm");
    wpm.backgroundColor = colors.main + "20";`,
);

fs.writeFileSync("frontend/src/ts/controllers/chart-controller.ts", code);

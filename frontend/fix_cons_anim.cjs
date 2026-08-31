const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/test/result.ts", "utf8");

const replacement = `function updateConsistency(): void {
  const consEl = qs("#result .stats .consistency .bottom");
  if (consEl) {
    const obj = { value: 0 };
    anime({
      targets: obj,
      value: result.consistency,
      easing: "easeOutExpo",
      duration: 1500,
      update: () => consEl.setText(Format.percentage(obj.value))
    });
  }`;

code = code.replace(
  /function updateConsistency\(\): void \{\s*qs\("#result \.stats \.consistency \.bottom"\)\?\.setText\(\s*Format\.percentage\(result\.consistency\),\s*\);/g,
  replacement,
);

fs.writeFileSync("frontend/src/ts/test/result.ts", code);

const fs = require("fs");
let code = fs.readFileSync("frontend/src/ts/test/result.ts", "utf8");

const replacement = `function updateWpmAndAcc(): void {
  let inf = false;
  if (result.wpm >= 1000) {
    inf = true;
  }

  qs("#result .stats .wpm .top .text")?.setText(
    \`Tezlik (\${Config.typingSpeedUnit})\`,
  );

  if (inf) {
    qs("#result .stats .wpm .bottom")?.setText("Infinite");
  } else {
    const wpmEl = qs("#result .stats .wpm .bottom");
    if (wpmEl) {
      const obj = { value: 0 };
      anime({
        targets: obj,
        value: result.wpm,
        easing: "easeOutExpo",
        duration: 1500,
        update: () => wpmEl.setText(Format.typingSpeed(obj.value))
      });
    }
  }

  const rawEl = qs("#result .stats .raw .bottom");
  if (rawEl) {
    const obj = { value: 0 };
    anime({
      targets: obj,
      value: result.rawWpm,
      easing: "easeOutExpo",
      duration: 1500,
      update: () => rawEl.setText(Format.typingSpeed(obj.value))
    });
  }

  const accEl = qs("#result .stats .acc .bottom");
  if (accEl) {
    const obj = { value: 0 };
    anime({
      targets: obj,
      value: result.acc,
      easing: "easeOutExpo",
      duration: 1500,
      update: () => accEl.setText(obj.value === 100 ? "100%" : Format.accuracy(obj.value))
    });
  }

  if (TestState.lastEventLog !== null) {
    const acc = getAccuracy(TestState.lastEventLog);`;

code = code.replace(
  /function updateWpmAndAcc\(\): void \{\s*let inf = false;\s*if \(result\.wpm >= 1000\) \{\s*inf = true;\s*\}\s*qs\("#result \.stats \.wpm \.top \.text"\)\?\.setText\(\s*`Tezlik \(\$\{Config\.typingSpeedUnit\}\)`,\s*\);\s*if \(inf\) \{\s*qs\("#result \.stats \.wpm \.bottom"\)\?\.setText\("Infinite"\);\s*\} else \{\s*qs\("#result \.stats \.wpm \.bottom"\)\?\.setText\(Format\.typingSpeed\(result\.wpm\)\);\s*\}\s*qs\("#result \.stats \.raw \.bottom"\)\?\.setText\(Format\.typingSpeed\(result\.rawWpm\)\);\s*qs\("#result \.stats \.acc \.bottom"\)\?\.setText\(\s*result\.acc === 100 \? "100%" : Format\.accuracy\(result\.acc\),\s*\);\s*if \(TestState\.lastEventLog !== null\) \{\s*const acc = getAccuracy\(TestState\.lastEventLog\);/g,
  replacement,
);

fs.writeFileSync("frontend/src/ts/test/result.ts", code);

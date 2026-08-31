const fs = require("fs");
let code = fs.readFileSync("frontend/src/styles/test.scss", "utf8");

const regex = /\n    \.stats \{[\s\S]+?#showWordHistoryButton \{/m;
const match = code.match(regex);
if (match) {
  const newCss = `
    .stats {
      grid-area: stats;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      background: var(--bg-color);
      padding: 2.5rem;
      border-radius: 1.5rem;
      border: 2px solid var(--sub-alt-color);
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
      margin-bottom: 1rem;

      &.morestats {
        justify-content: space-around;
        padding: 1rem 2rem;
        border: none;
        box-shadow: none;
        background: transparent;
        margin-bottom: 0;
      }

      .subgroup {
        display: flex;
        gap: 1rem;
      }

      .group {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .wpm, .acc {
        .top {
          font-size: 1.5rem;
          color: var(--sub-color);
          margin-bottom: 0.5rem;
          font-weight: bold;
          display: flex;
          align-items: center;

          .crown {
            margin-left: 0.5rem;
            margin-top: -0.2rem;
            font-size: 0.7rem;
            background: var(--main-color);
            color: var(--bg-color);
            width: 1.7rem;
            height: 1.7rem;
            border-radius: var(--roundness);
            display: grid;
            grid-template-areas: "icon";
            align-items: center;
            justify-items: center;
            transition: opacity 0.125s, background 0.125s, color 0.125s, outline 0.125s;

            i { grid-area: icon; }
            .fa-slash { color: var(--main-color); font-size: 1.2rem; opacity: 0; }
            .fa-exclamation-triangle { display: none; }
            &.pending { .fa-crown { display: none; } .fa-slash { display: none; } }
            &.ineligible { .fa-slash { opacity: 1; } }
            &.error { .fa-crown { display: none; } .fa-question { display: none; } }
            &.warning { .fa-crown { display: none; } .fa-exclamation-triangle { display: block; } }
          }
        }
        .bottom {
          font-size: 5rem;
          line-height: 5rem;
          font-weight: 900;
          color: var(--main-color);
          text-shadow: 0 4px 12px var(--sub-alt-color);
        }
      }

      .testType, .leaderboards, .info, .tags, .raw, .time, .consistency, .source, .burst {
        .top {
          font-size: 1rem;
          color: var(--sub-color);
          margin-bottom: 0.2rem;
        }
        .bottom {
          font-size: 1.5rem;
          color: var(--text-color);
          font-weight: bold;
        }
      }
    }

#showWordHistoryButton {`;
  code = code.replace(regex, newCss);
  fs.writeFileSync("frontend/src/styles/test.scss", code);
  console.log("Success");
} else {
  console.log("Not matched");
}

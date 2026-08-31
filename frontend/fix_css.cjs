const fs = require("fs");
let code = fs.readFileSync("frontend/src/styles/test.scss", "utf8");

const newStatsCss = `    .stats {
      grid-area: stats;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      background: var(--bg-color);
      padding: 2rem;
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
        }
        .bottom {
          font-size: 4.5rem;
          line-height: 4.5rem;
          font-weight: 900;
          color: var(--main-color);
          text-shadow: 0 4px 12px var(--sub-alt-color);
        }
      }

      .testType, .leaderboards, .info, .tags, .raw, .time, .consistency, .source {
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
    }`;

code = code.replace(
  /    \.stats \{\s*grid-area: stats;[\s\S]*?\.bottom \{\s*font-size: 4rem;\s*line-height: 4rem;\s*\}\s*\}/,
  newStatsCss,
);

fs.writeFileSync("frontend/src/styles/test.scss", code);

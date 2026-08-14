import "./event-handlers/global";
import "./event-handlers/test";

import { init } from "./firebase";
import "./ui";

import { onAuthStateChanged } from "./auth";
import "./test/caps-warning";
import "./input/listeners";
import "./controllers/route-controller";
import "./controllers/theme-controller";
import "./elements/no-css";

import "./test/tts";
import * as Focus from "./test/focus";
import { fetchLatestVersion } from "./utils/version";
import * as Cookies from "./cookies";
import "./elements/psa";
import "./controllers/url-handler";
import { applyEngineSettings } from "./anim";
import { mountComponents } from "./components/mount";
import "./ready";
import { setVersion } from "./states/core";
import { loadFromLocalStorage } from "./config/lifecycle";

import "./input/hotkeys";
import { showModal } from "./states/modals";

try {
  // Lock Math.random
  Object.defineProperty(Math, "random", {
    value: Math.random,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  // Freeze Math object
  Object.freeze(Math);

  // Lock Math on window
  Object.defineProperty(window, "Math", {
    value: Math,
    writable: false,
    configurable: false,
    enumerable: true,
  });
} catch {
  // Ignore in environments where window.Math is non-configurable
}

applyEngineSettings();
void loadFromLocalStorage();
void fetchLatestVersion().then((data) => {
  if (data === null) return;
  setVersion(data);
});

mountComponents();
Focus.set(true, true);

const accepted = Cookies.getAcceptedCookies();
if (accepted === null) {
  showModal("Cookies");
}
void init(onAuthStateChanged).then(() => {
  if (accepted !== null) {
    Cookies.activateWhatsAccepted();
  }
});

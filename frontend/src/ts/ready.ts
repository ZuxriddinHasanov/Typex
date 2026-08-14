import * as Misc from "./utils/misc";
import * as ServerConfiguration from "./ape/server-configuration";
import { configLoadPromise } from "./config/lifecycle";
import { authPromise } from "./firebase";
import { animate } from "animejs";
import { onDOMReady, qs } from "./utils/dom";
import { isDevEnvironment } from "./utils/env";

onDOMReady(async () => {
  try {
    await configLoadPromise;
  } catch (e) {
    console.error("Failed to load config", e);
  }
  try {
    await authPromise;
  } catch (e) {
    console.error("Failed to load auth", e);
  }

  //this line goes back to pretty much the beginning of the project and im pretty sure its here
  //to make sure the initial theme application doesnt animate the background color
  qs("body")?.setStyle({
    transition: "background .25s, transform .05s",
  });
  const app = document.querySelector<HTMLElement>("#app");
  app?.classList.remove("hidden");
  if (app !== null) {
    try {
      animate(app, {
        opacity: [0, 1],
        duration: Misc.applyReducedMotion(250),
      });
    } catch {
      app.style.opacity = "1";
    }
  }

  void ServerConfiguration.sync();

  if (isDevEnvironment()) {
    void navigator.serviceWorker
      .getRegistrations()
      .then(function (registrations) {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
  } else {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log(
              "ServiceWorker registration successful with scope: ",
              registration.scope,
            );
          })
          .catch((error: unknown) => {
            console.error("ServiceWorker registration failed: ", error);
          });
      });
    }
  }
});

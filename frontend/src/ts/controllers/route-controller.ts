import * as PageController from "./page-controller";
import * as PageTransition from "../legacy-states/page-transition";
import { isAuthAvailable } from "../firebase";
import { isAuthenticated } from "../states/core";
import * as TestState from "../test/test-state";
import { navigationEvent, type NavigateOptions } from "../events/navigation";
import { authEvent } from "../events/auth";
import { isDevEnvironment } from "../utils/env";

//source: https://www.youtube.com/watch?v=OstALBk-jTc
// https://www.youtube.com/watch?v=OstALBk-jTc

function pathToRegex(path: string): RegExp {
  return new RegExp(`^${path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)")}$`);
}

function getParams(match: {
  route: Route;
  result: RegExpMatchArray;
}): Record<string, string> {
  const values = match.result.slice(1);
  const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(
    (result) => result[1],
  );

  const a = keys.map((key, index) => [key, values[index]]);
  return Object.fromEntries(a) as Record<string, string>;
}

type Route = {
  path: string;
  load: (
    params: Record<string, string>,
    navigateOptions: NavigateOptions,
  ) => Promise<void>;
};

const route404: Route = {
  path: "404",
  load: async (_params, options) => {
    await PageController.change("404", options);
  },
};

// NOTE: whenever adding a route add the pathname to the `firebase.json` rewrite rule
const routes: Route[] = [
  {
    path: "/",
    load: async (_params, options) => {
      await PageController.change("test", options);
    },
  },
  {
    path: "/landing",
    load: async (_params, options) => {
      await PageController.change("landing", options);
    },
  },
  {
    path: "/seo-typing-test",
    load: async (_params, options) => {
      await PageController.change("seo", options);
    },
  },
  {
    path: "/test",
    load: async (_params, options) => {
      await PageController.change("test", options);
    },
  },
  {
    path: "/verify",
    load: async (_params, options) => {
      await PageController.change("test", options);
    },
  },
  {
    path: "/leaderboards",
    load: async (_params, options) => {
      await PageController.change("leaderboards", options);
    },
  },
  {
    path: "/about",
    load: async (_params, options) => {
      await PageController.change("about", options);
    },
  },
  {
    path: "/privacy-policy",
    load: async (_params, options) => {
      await PageController.change("privacy", options);
    },
  },
  {
    path: "/terms-of-service",
    load: async (_params, options) => {
      await PageController.change("terms", options);
    },
  },
  {
    path: "/security-policy",
    load: async (_params, options) => {
      await PageController.change("security", options);
    },
  },
  {
    path: "/login",
    load: async (_params, options) => {
      if (isAuthenticated()) {
        await navigate("/onboarding", options);
        return;
      }
      await PageController.change("login", options);
    },
  },
  {
    path: "/typeuz-hq",
    load: async (_params, options) => {
      await PageController.change("adminLogin", options);
    },
  },
  {
    path: "/typeuz-hq/dashboard",
    load: async (_params, options) => {
      await PageController.change("adminDashboard", options);
    },
  },
  {
    path: "/typeuz-hq/users",
    load: async (_params, options) => {
      await PageController.change("adminUsers", options);
    },
  },
  {
    path: "/typeuz-hq/users/:uid",
    load: async (params, options) => {
      await PageController.change("adminUserDetail", { ...options, params });
    },
  },
  {
    path: "/typeuz-hq/content",
    load: async (_params, options) => {
      await PageController.change("adminContent", options);
    },
  },
  {
    path: "/typeuz-hq/analytics",
    load: async (_params, options) => {
      await PageController.change("adminAnalytics", options);
    },
  },
  {
    path: "/typeuz-hq/ai",
    load: async (_params, options) => {
      await PageController.change("adminAi", options);
    },
  },
  {
    path: "/typeuz-hq/notifications",
    load: async (_params, options) => {
      await PageController.change("adminNotifications", options);
    },
  },
  {
    path: "/typeuz-hq/ads",
    load: async (_params, options) => {
      await PageController.change("adminAds", options);
    },
  },
  {
    path: "/typeuz-hq/settings",
    load: async (_params, options) => {
      await PageController.change("adminSettings", options);
    },
  },
  {
    path: "/onboarding",
    load: async (_params, options) => {
      if (!isAuthAvailable() && !isDevEnvironment()) {
        await navigate("/", options);
        return;
      }
      if (!isAuthenticated()) {
        await navigate("/login", options);
        return;
      }
      if (localStorage.getItem("typeuz_onboarding_done") !== null) {
        await navigate("/account", options);
        return;
      }
      await PageController.change("onboarding", options);
    },
  },
  {
    path: "/account",
    load: async (_params, options) => {
      if (!isAuthAvailable() && !isDevEnvironment()) {
        await navigate("/", options);
        return;
      }
      if (!isAuthenticated()) {
        await navigate("/login", options);
        return;
      }
      await PageController.change("account", options);
    },
  },
  {
    path: "/profile/:uidOrName",
    load: async (params, options) => {
      await PageController.change("profile", { ...options, params });
    },
  },
];

export async function navigate(
  url = window.location.pathname +
    window.location.search +
    window.location.hash,
  options = {} as NavigateOptions,
): Promise<void> {
  if (
    !options.force &&
    (TestState.testRestarting ||
      TestState.resultCalculating ||
      PageTransition.get())
  ) {
    console.debug(
      `navigate: ${url} ignored, page is busy (testRestarting: ${
        TestState.testRestarting
      }, resultCalculating: ${
        TestState.resultCalculating
      }, pageTransition: ${PageTransition.get()})`,
    );
    return;
  }

  url = url.replace(/\/$/, "");
  if (url === "") url = "/";

  // only push to history if we're navigating to a different URL
  const currentUrl = new URL(window.location.href);
  const targetUrl = new URL(url, window.location.origin);

  if (
    currentUrl.pathname + currentUrl.search + currentUrl.hash !==
    targetUrl.pathname + targetUrl.search + targetUrl.hash
  ) {
    history.pushState(null, "", url);
  }

  await router(options);
}

async function router(options = {} as NavigateOptions): Promise<void> {
  const matches = routes.map((r) => {
    return {
      route: r,
      result: location.pathname.match(pathToRegex(r.path)),
    };
  });

  const match = matches.find((m) => m.result !== null) as {
    route: Route;
    result: RegExpMatchArray;
  };

  if (match === undefined) {
    await route404.load(
      {},
      {
        force: true,
      },
    );
    return;
  }

  await match.route.load(getParams(match), options);
}

window.addEventListener("popstate", () => {
  void router();
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", (e) => {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>(
      "[router-link]",
    );
    if (link) {
      e.preventDefault();
      void navigate(link.getAttribute("href") ?? link.pathname);
    }
  });
});

navigationEvent.subscribe(({ url, options }) => {
  void navigate(url, options);
});

authEvent.subscribe((event) => {
  if (event.type === "authStateChanged") {
    let keyframes = [
      {
        percentage: 90,
        durationMs: 1000,
        text: "Downloading user data...",
      },
    ];

    //undefined means navigate to whatever the current window.location.pathname is
    void navigate(undefined, {
      force: true,
      loadingOptions: {
        loadingMode: () => {
          if (event.data.isUserSignedIn) {
            return "sync";
          } else {
            return "none";
          }
        },
        loadingPromise: async () => {
          await event.data.loadPromise;
        },
        style: "bar",
        keyframes: keyframes,
      },
    }).finally(() => {
      document.body.classList.remove("loading");
    });
  }
});

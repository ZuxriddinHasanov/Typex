import { Plugin } from "vite";
import { EnvConfig } from "virtual:env-config";

const virtualModuleId = "virtual:env-config";
const resolvedVirtualModuleId = `\0${virtualModuleId}`;

function fallback(value: string | undefined | null, fallback: string): string {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

export function envConfig(options: {
  isDevelopment: boolean;
  clientVersion: string;
  env: Record<string, string>;
}): Plugin {
  return {
    name: "virtual-env-config",
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
      return;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const devConfig: EnvConfig = {
          isDevelopment: true,
          backendUrl: fallback(
            options.env["BACKEND_URL"],
            "http://localhost:5005",
          ),
          clientVersion: options.clientVersion,
          recaptchaSiteKey: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
          googleClientId: fallback(
            options.env["VITE_GOOGLE_CLIENT_ID"],
            "254290811654-97e6thf6odffs58iop3it77k1s2tgq4r.apps.googleusercontent.com",
          ),
          quickLoginEmail: options.env["QUICK_LOGIN_EMAIL"],
          quickLoginPassword: options.env["QUICK_LOGIN_PASSWORD"],
        };

        const prodConfig: EnvConfig = {
          isDevelopment: false,
          backendUrl: fallback(
            options.env["BACKEND_URL"],
            "https://api.typex.uz",
          ),
          recaptchaSiteKey: fallback(
            options.env["RECAPTCHA_SITE_KEY"],
            "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
          ),
          googleClientId: fallback(
            options.env["VITE_GOOGLE_CLIENT_ID"],
            "254290811654-97e6thf6odffs58iop3it77k1s2tgq4r.apps.googleusercontent.com",
          ),
          quickLoginEmail: undefined,
          quickLoginPassword: undefined,
          clientVersion: options.clientVersion,
        };

        if (
          !options.isDevelopment &&
          (options.env["BACKEND_URL"] === undefined ||
            options.env["BACKEND_URL"] === "")
        ) {
          console.warn(
            "\x1b[33m%s\x1b[0m",
            "WARNING: BACKEND_URL not set. Defaulting to https://api.typeuz.uz. " +
              "Set BACKEND_URL env var to point to your backend (e.g. https://your-app.railway.app).",
          );
        }

        const envConfig = options.isDevelopment ? devConfig : prodConfig;
        return `
          export const envConfig = ${JSON.stringify(envConfig)};
        `;
      }
      return;
    },
  };
}

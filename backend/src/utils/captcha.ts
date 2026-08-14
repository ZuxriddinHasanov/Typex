import { isDevEnvironment } from "./misc";

type CaptchaData = {
  success: boolean;
  challenge_ts?: number;
  hostname: string;
  "error-codes"?: string[];
};

const recaptchaSecret = process.env["RECAPTCHA_SECRET"] ?? null;

export async function verify(captcha?: string): Promise<boolean> {
  if (
    isDevEnvironment() ||
    recaptchaSecret === null ||
    recaptchaSecret === ""
  ) {
    return true;
  }

  if (captcha === undefined || captcha === "") {
    return false;
  }

  const response = await fetch(
    `https://www.google.com/recaptcha/api/siteverify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${recaptchaSecret}&response=${captcha}`,
    },
  );

  if (!response.ok) {
    return false;
  } else {
    const captchaData = (await response.json()) as CaptchaData;
    return captchaData.success;
  }
}

import nodemailer from "nodemailer";
import Logger from "./logger";
import { isDevEnvironment } from "./misc";

const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT, EMAIL_FROM } =
  process.env;

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: parseInt(EMAIL_PORT ?? "587", 10),
  secure: EMAIL_PORT === "465",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

export async function init(): Promise<void> {
  if (isDevEnvironment()) return;
  try {
    const success = await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Email verification timeout")), 5000))
    ]);
    if (success) {
      Logger.success("Email client verified and ready");
    }
  } catch (error) {
    Logger.error(
      `Email client verification failed: ${(error as Error).message}`
    );
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  if (isDevEnvironment()) {
    Logger.info(`[DEV] Pretending to send email to ${to}: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: EMAIL_FROM ?? "noreply@typeuz.uz",
      to,
      subject,
      html,
    });
  } catch (error) {
    Logger.error(`Failed to send email to ${to}: ${(error as Error).message}`);
    throw error;
  }
}

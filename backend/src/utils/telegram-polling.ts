import * as UserDAL from "../dal/user";
import Logger from "./logger";
import { buildMonkeyMail } from "./monkey-mail";

// Telegram API Types
type TelegramUser = {
  id: number;
};
type TelegramChat = {
  id: number;
};
type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  caption?: string;
  reply_to_message?: TelegramMessage;
};
type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};
type TelegramResponse = {
  ok: boolean;
  result?: TelegramUpdate[];
};

async function processMessage(msg: TelegramMessage, token: string): Promise<void> {
  if (msg.reply_to_message === undefined || msg.text === undefined) return;
  const originalText = msg.reply_to_message.text ?? msg.reply_to_message.caption ?? "";
  Logger.info(`Telegram polling: received a reply to a message. Original text: ${originalText}`);
  
  const regex = /UID:\s*`?([a-zA-Z0-9_-]+)`?/;
  const uidMatch = regex.exec(originalText);
  
  if (uidMatch !== null && uidMatch[1] !== undefined) {
    const uid = uidMatch[1];
    Logger.info(`Telegram polling: UID match found: ${uid}`);
    const replyText = msg.text;
    try {
      const mail = buildMonkeyMail({
        subject: "Fikringiz uchun javob (Admindan)",
        body: replyText,
      });
      const config = { enabled: true, maxMail: 100 };
      await UserDAL.addToInbox(uid, [mail], config);
      
      // Send confirmation to admin
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: msg.chat.id,
          text: `Xabar foydalanuvchiga yuborildi! ✉️`,
          reply_to_message_id: msg.message_id
        }),
      });
    } catch (e) {
      Logger.error(`Failed to send reply to user inbox: ${String(e)}`);
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: msg.chat.id,
          text: `Xatolik yuz berdi: ${(e as Error).message}`,
          reply_to_message_id: msg.message_id
        }),
      });
    }
  } else {
    Logger.info(`Telegram polling: UID match FAILED for text: ${originalText}`);
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: msg.chat.id,
        text: `Xatolik: Bu xabardan foydalanuvchi UID-si topilmadi. Javobingiz yuborilmadi.`,
        reply_to_message_id: msg.message_id
      }),
    });
  }
}

export function startTelegramPolling(): void {
  const token = process.env["TELEGRAM_BOT_TOKEN"] ?? "8795683362:AAF3aOEI11aSlj9jXKo1Czc0z8P8iEgttEg";
  if (token === "") return;

  Logger.info("Telegram fetch-based polling started");
  let lastUpdateId = 0;

  const poll = async (): Promise<void> => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
      if (response.ok) {
        const data = (await response.json()) as TelegramResponse;
        if (data.ok && data.result !== undefined) {
          for (const update of data.result) {
            lastUpdateId = update.update_id;
            const msg = update.message;
            if (msg !== undefined) {
              await processMessage(msg, token);
            }
          }
        }
      }
    } catch (err) {
      Logger.error(`Telegram polling error: ${String(err)}`);
    }
    setTimeout(() => void poll(), 1000);
  };

  void poll();
}

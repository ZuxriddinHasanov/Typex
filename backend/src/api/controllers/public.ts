import {
  GetSpeedHistogramQuery,
  GetSpeedHistogramResponse,
  GetTypingStatsResponse,
} from "@typeuz/contracts/public";
import * as PublicDAL from "../../dal/public";
import * as UserDAL from "../../dal/user";
import { TypeUZResponse } from "../../utils/typeuz-response";
import { TypeUZRequest } from "../types";
import { isDevEnvironment } from "../../utils/misc";
import { devGet } from "../../utils/dev-store";
import { collection } from "../../init/db";

export async function getSpeedHistogram(
  req: TypeUZRequest<GetSpeedHistogramQuery>,
): Promise<GetSpeedHistogramResponse> {
  const { language, mode, mode2 } = req.query;
  const data = await PublicDAL.getSpeedHistogram(language, mode, mode2);
  return new TypeUZResponse("Public speed histogram retrieved", data);
}

export async function getTypingStats(
  _req: TypeUZRequest,
): Promise<GetTypingStatsResponse> {
  const data = await PublicDAL.getTypingStats();
  return new TypeUZResponse("Public typing stats retrieved", data as never);
}

export async function getPublicAdConfig(
  _req: TypeUZRequest,
): Promise<
  TypeUZResponse<{
    enabled: boolean;
    slots: Array<{ slotId: string; imageUrl?: string; targetUrl?: string }>;
  }>
> {
  if (isDevEnvironment()) {
    const ads = devGet<{
      enabled: boolean;
      masterToggle: boolean;
      creatives: Array<{ id: string; imageUrl: string; targetUrl: string }>;
      slots: Array<{ slotId: string; creativeId?: string; enabled: boolean }>;
    }>("ad_config");
    if (!ads || !ads.enabled || !ads.masterToggle) {
      return new TypeUZResponse("OK", { enabled: false, slots: [] });
    }
    return new TypeUZResponse("OK", {
      enabled: true,
      slots: ads.slots
        .filter(
          (s) => s.enabled && s.creativeId !== undefined && s.creativeId !== "",
        )
        .map((s) => {
          const cr = ads.creatives.find((c) => c.id === s.creativeId);
          return {
            slotId: s.slotId,
            imageUrl: cr?.imageUrl,
            targetUrl: cr?.targetUrl,
          };
        })
        .filter(
          (s) =>
            s.imageUrl !== undefined &&
            s.imageUrl !== "" &&
            s.targetUrl !== undefined &&
            s.targetUrl !== "",
        ),
    });
  }

  try {
    const doc = await collection("configuration").findOne({ _id: "ads" });
    if (!doc) return new TypeUZResponse("OK", { enabled: false, slots: [] });

    const ads = doc as unknown as {
      enabled: boolean;
      masterToggle: boolean;
      creatives: Array<{ id: string; imageUrl: string; targetUrl: string }>;
      slots: Array<{ slotId: string; creativeId?: string; enabled: boolean }>;
    };

    if (!ads.enabled || !ads.masterToggle) {
      return new TypeUZResponse("OK", { enabled: false, slots: [] });
    }

    return new TypeUZResponse("OK", {
      enabled: true,
      slots: ads.slots
        .filter(
          (s) => s.enabled && s.creativeId !== undefined && s.creativeId !== "",
        )
        .map((s) => {
          const cr = ads.creatives.find((c) => c.id === s.creativeId);
          return {
            slotId: s.slotId,
            imageUrl: cr?.imageUrl,
            targetUrl: cr?.targetUrl,
          };
        })
        .filter(
          (s) =>
            s.imageUrl !== undefined &&
            s.imageUrl !== "" &&
            s.targetUrl !== undefined &&
            s.targetUrl !== "",
        ),
    });
  } catch {
    return new TypeUZResponse("OK", { enabled: false, slots: [] });
  }
}

// --- Shared site content loader (also used by admin controller) ---
// We share via dev-store key "site_content"
const SITE_CONTENT_KEY = "site_content";

type SiteContentData = {
  hero: { title: string; subtitle: string; description: string };
  features: Array<{ icon: string; title: string; description: string }>;
  aboutCards: Array<{ icon: string; title: string; description: string }>;
  footer: { brandName: string; tagline: string; telegram: string };
};

const defaultSiteContent: SiteContentData = {
  hero: {
    title: "TypeX.uz",
    subtitle: "Tez yozishni o'rganing",
    description:
      "O'zbekistonning birinchi yozuv tezligini o'lchash platformasi. Klaviaturada tez va aniq yozishni o'rganing, do'stlar bilan bellashing va reytingda ko'tariling.",
  },
  features: [
    {
      icon: "fa-robot",
      title: "AI Tahlil",
      description:
        "Sun'iy intellekt orqali xatolaringizni tahlil qiling va haftalik hisobotlar oling",
    },
    {
      icon: "fa-tachometer-alt",
      title: "Tezlikni o'lchash",
      description:
        "WPM, aniqlik va vaqtni real vaqtda yuqori aniqlikda kuzating",
    },
    {
      icon: "fa-chart-bar",
      title: "Chuqur Statistika",
      description:
        "Barcha natijalaringizni bulutda saqlang va professional grafiklarda tahlil qiling",
    },
    {
      icon: "fa-trophy",
      title: "Global Reyting",
      description:
        "Jahon miqyosidagi yetakchilar bilan bellashing va Top 100 likka kiring",
    },
    {
      icon: "fa-palette",
      title: "O'zingizga moslash",
      description:
        "Yuzlab mavzular va shriftlar yordamida interfeysni to'liq shaxsiylashtiring",
    },
    {
      icon: "fa-user-friends",
      title: "Do'stlar bilan",
      description:
        "Do'stlaringizni qo'shing va birgalikda yozish tezligida musobaqalashing",
    },
  ],
  aboutCards: [
    {
      icon: "fa-language",
      title: "Ko'p tilli",
      description: "O'zbek, Rus va Ingliz tillarida yozing",
    },
    {
      icon: "fa-bolt",
      title: "Real vaqt",
      description: "Real vaqt rejimida natijalarni kuzating",
    },
    {
      icon: "fa-mobile-alt",
      title: "Moslashuvchan",
      description: "Barcha qurilmalarda ishlaydi",
    },
  ],
  footer: {
    brandName: "TypeX.uz",
    tagline: "O'zbekistonning birinchi yozuv tezligi platformasi",
    telegram: "https://t.me/root_v7be",
  },
};

function loadSiteContent(): SiteContentData {
  if (!isDevEnvironment()) return defaultSiteContent;
  const saved = devGet<SiteContentData>(SITE_CONTENT_KEY);
  return saved ?? defaultSiteContent;
}

export async function getSiteContent(
  _req: TypeUZRequest,
): Promise<TypeUZResponse<SiteContentData>> {
  return new TypeUZResponse("OK", loadSiteContent());
}

export async function submitFeedback(
  req: TypeUZRequest,
): Promise<TypeUZResponse<{ success: boolean }>> {
  const body = (req as any).body;
  const { title, description, imageBase64 } = body;
  const token = process.env["TELEGRAM_BOT_TOKEN"] || "8795683362:AAF3aOEI11aSlj9jXKo1Czc0z8P8iEgttEg";
  const chatIdEnv = process.env["TELEGRAM_CHAT_ID"];
  const chat1 = process.env["TELEGRAM_CHAT_ID_1"] || "5594075164";
  const chat2 = process.env["TELEGRAM_CHAT_ID_2"] || "5860578943";
  const chat3 = process.env["TELEGRAM_CHAT_ID_3"] || "7454746576";
  
  const chatIds = new Set<string>();
  if (chatIdEnv) chatIdEnv.split(",").map(id => id.trim()).filter(Boolean).forEach(id => chatIds.add(id));
  if (chat1) chatIds.add(chat1.trim());
  if (chat2) chatIds.add(chat2.trim());
  if (chat3) chatIds.add(chat3.trim());
    
  console.log("Token:", token ? "exists" : "missing", "ChatIds:", Array.from(chatIds));

  if (token && chatIds.size > 0) {
    let userStr = "Mehmon";
    const uid = req.ctx?.decodedToken?.uid;
    if (uid) {
      try {
        const user = await UserDAL.getUser(uid, "submit feedback");
        userStr = `${user.name} (${req.ctx?.decodedToken?.email ?? "Noma'lum email"})\n*UID:* \`${uid}\``;
      } catch (e) {
        userStr = `Mehmon\n*UID:* \`${uid}\``;
      }
    }

    let message = `🔔 *Yangi Shikoyat / Fikr*\n\n`;
    message += `*Sarlavha:* ${title}\n`;
    message += `*Batafsil:* ${description}\n`;
    message += `*Foydalanuvchi:* ${userStr}`;

    for (const chatId of chatIds) {
      if (imageBase64) {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        
        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("caption", message);
        formData.append("parse_mode", "Markdown");
        formData.append("photo", new Blob([buffer]), "screenshot.png");

        fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: "POST",
          body: formData,
        }).then(res => res.text().then(t => console.log(`Telegram sendPhoto res:`, t))).catch(err => console.error(`Telegram API error for chat ${chatId}:`, err));
      } else {
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "Markdown",
          }),
        }).then(res => res.text().then(t => console.log(`Telegram sendMessage res:`, t))).catch(err => console.error(`Telegram API error for chat ${chatId}:`, err));
      }
    }
  }

  return new TypeUZResponse("Feedback submitted", { success: true, debug: { token: !!token, chatIds: Array.from(chatIds) } } as any);
}

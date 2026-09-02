import { contract } from "@typeuz/contracts";

import { isDevEnvironment } from "../../utils/misc";
import { devGet } from "../../utils/dev-store";
import { TypeUZResponse } from "../../utils/typeuz-response";
import { TypeUZRequest } from "../types";
import * as PublicDAL from "../../dal/public";
import { GetTypingStatsResponse } from "@typeuz/contracts/public";
import Logger from "../../utils/logger";

export async function getSpeedHistogram(
  _req: any,
): Promise<TypeUZResponse<{ [key: string]: number }>> {
  const { language, mode, mode2 } = _req.query;
  const data = await PublicDAL.getSpeedHistogram(language, mode, mode2);
  return new TypeUZResponse("Speed histogram retrieved", data as never);
}

export async function getTypingStats(
  _req: any,
): Promise<GetTypingStatsResponse> {
  const data = await PublicDAL.getTypingStats();
  return new TypeUZResponse("Public typing stats retrieved", data as never);
}

export async function getPublicAdConfig(
  _req: any,
): Promise<
  TypeUZResponse<{
    enabled: boolean;
    slots: Array<{ slotId: string; imageUrl?: string; targetUrl?: string }>;
  }>
> {
  const defaultEmpty = { enabled: false, slots: [] };
  

  if (isDevEnvironment()) {
    const ads = devGet<any>("ad_config");
    if (!ads || !ads.enabled) {
      return new TypeUZResponse("OK", defaultEmpty);
    }
    return new TypeUZResponse("OK", {
      enabled: true,
      slots: ads.slots
        .filter((s: any) => s.enabled && s.creativeId)
        .map((s: any) => {
          const cr = ads.creatives.find((c: any) => c.id === s.creativeId);
          return { slotId: s.slotId, imageUrl: cr?.imageUrl, targetUrl: cr?.targetUrl, size: cr?.size };
        })
        .filter((s: any) => s.imageUrl && s.targetUrl !== undefined),
    });
  }

  const { getDb } = await import("../../init/db.js");
  const db = getDb();
  if (!db) {
    console.log("DB_IS_NULL");
    return new TypeUZResponse("OK", defaultEmpty);
  }

  try {
    const res = await db.query("SELECT data FROM configuration WHERE _id = 'ad_config'");
    if (res.rows.length === 0) {
      console.log("DB_ROWS_EMPTY");
      return new TypeUZResponse("OK", defaultEmpty);
    }

    const ads = res.rows[0].data;
    console.log("DB_ADS_OBJ:", JSON.stringify(ads));
    if (!ads || !ads.enabled) {
      console.log("DB_ADS_DISABLED");
      return new TypeUZResponse("OK", defaultEmpty);
    }

    const resultSlots = (ads.slots || [])
      .filter((s: any) => s.enabled && s.creativeId)
      .map((s: any) => {
        const cr = (ads.creatives || []).find((c: any) => c.id === s.creativeId);
        return { slotId: s.slotId, imageUrl: cr?.imageUrl, targetUrl: cr?.targetUrl, size: cr?.size };
      })
      .filter((s: any) => s.imageUrl && s.targetUrl !== undefined);

    console.log("DB_RESULT_SLOTS:", JSON.stringify(resultSlots));
    return new TypeUZResponse("OK", {
      enabled: true,
      slots: resultSlots,
    });
  } catch (e) {
    console.log("DB_ERROR:", e);
    return new TypeUZResponse("OK", defaultEmpty);
  }
}

// --- Shared site content loader (also used by admin controller) ---
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

export async function getSiteContent(_req: any) {
  try {
    const data = loadSiteContent();
    return new TypeUZResponse("OK", data as never);
  } catch (e) {
    Logger.error(`Failed to get site content: ${e}`);
    return new TypeUZResponse("Error", defaultSiteContent as never);
  }
}


export async function submitFeedback(req: any) {
  if (isDevEnvironment()) {
    return new TypeUZResponse("Fikr yuborildi (Dev Mode)", {});
  }
  
  const { title, description, imageBase64 } = req.body;
  
  const token =
    process.env["TELEGRAM_BOT_TOKEN"] ??
    "8795683362:AAF3aOEI11aSlj9jXKo1Czc0z8P8iEgttEg";
  const chatIdEnv = process.env["TELEGRAM_CHAT_ID"];
  const chat1 = process.env["TELEGRAM_CHAT_ID_1"] ?? "5594075164";
  const chat2 = process.env["TELEGRAM_CHAT_ID_2"] ?? "5860578943";
  const chat3 = process.env["TELEGRAM_CHAT_ID_3"] ?? "7454746576";

  const chatIds = new Set<string>();
  if (chatIdEnv !== undefined && chatIdEnv !== "") {
    chatIdEnv.split(",").forEach(id => chatIds.add(id.trim()));
  }
  if (chat1 !== "") chatIds.add(chat1.trim());
  if (chat2 !== "") chatIds.add(chat2.trim());
  if (chat3 !== "") chatIds.add(chat3.trim());

  if (token !== "" && chatIds.size > 0) {
        let userDisplay = "Mehmon";
    const uid = req.ctx?.decodedToken?.uid;
    if (uid && uid !== "" && !uid.startsWith("guest_")) {
      try {
        const UserDAL = require("../../dal/user");
        const reporter = await UserDAL.getUser(uid, "submitFeedback");
        userDisplay = `${reporter.name} (${reporter.email ?? "Noma'lum"})`;
      } catch (e) {
        userDisplay = `UID: ${uid}`;
      }
    }
    let uidStr = uid && !uid.startsWith("guest_") ? `*UID:* \`${uid}\`\n` : "";
    const msg = `?? *Yangi Fikr / Shikoyat*\n\n*Kimdan:* ${userDisplay}\n${uidStr}*Mavzu:* ${title}\n*Tafsilot:* ${description}`;
    
    for (const chatId of chatIds) {
      if (!chatId) continue;
      
      try {
        if (imageBase64 && imageBase64.startsWith("data:image")) {
          const b64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(b64Data, "base64");
          
          const formData = new FormData();
          formData.append("chat_id", chatId);
          formData.append("caption", msg);
          formData.append("parse_mode", "Markdown");
          
          const blob = new Blob([buffer], { type: "image/png" });
          formData.append("photo", blob, "screenshot.png");
          
          await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: "POST",
            body: formData,
          });
        } else {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: msg,
              parse_mode: "Markdown",
            }),
          });
        }
      } catch (e) {
        Logger.error(`Error sending feedback to TG: ${e}`);
      }
    }
  }

  return new TypeUZResponse("Fikr muvaffaqiyatli yuborildi. Rahmat!", {});
}









export async function logAdView(req: TypeUZRequest): Promise<TypeUZResponse<null>> {
  const { getDb } = await import('../../init/db.js');
  const db = getDb();
  if (!db) return new TypeUZResponse('No DB', null);
  
  if (req.ctx.decodedToken.uid) {
    await db.query('UPDATE users SET ad_views = COALESCE(ad_views, 0) + 1 WHERE uid = $1', [req.ctx.decodedToken.uid]);
  }
  return new TypeUZResponse('Logged', null);
}



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
          return { slotId: s.slotId, imageUrl: cr?.imageUrl, targetUrl: cr?.targetUrl };
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
        return { slotId: s.slotId, imageUrl: cr?.imageUrl, targetUrl: cr?.targetUrl };
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
  
  const { text } = req.body;
  if (!text || text.length < 5) {
    return new TypeUZResponse("Matn juda qisqa", {});
  }
  
  Logger.info(`Feedback received: ${text.substring(0, 50)}...`);
  
  // Here we would typically save to DB or send email/telegram
  return new TypeUZResponse("Fikr muvaffaqiyatli yuborildi. Rahmat!", {});
}

import {
  GetSpeedHistogramQuery,
  GetSpeedHistogramResponse,
  GetTypingStatsResponse,
} from "@typeuz/contracts/public";
import * as PublicDAL from "../../dal/public";
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

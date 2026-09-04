import type { PageName } from "../pages/page";

export type SeoConfig = {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical: string;
  ogImage?: string;
  robots?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>[];
};

const BASE_URL = "https://typex.uz";
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/TypeXsocial.png`;

function u(path: string): string {
  return `${BASE_URL}${path}`;
}

export const seoConfig: Record<string, SeoConfig> = {
  landing: {
    title: "TypeX — O'zbek tilidagi yozuv tezligi testi",
    description:
      "O'zbek tilidagi eng zamonaviy yozuv tezligi testi. WPM va aniqlikni o'lchang, reytingda yuksaling, do'stlaringiz bilan bellashing. Bepul, ro'yxatsiz sinab ko'ring! Klaviaturada tez yozishni o'rganing.",
    canonical: u("/"),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "TypeX",
        url: BASE_URL,
        description:
          "O'zbek tilidagi eng zamonaviy yozuv tezligi testi. Bepul onlayn typing test.",
        applicationCategory: "EducationalApplication",
        operatingSystem: "All",
        author: { "@type": "Organization", name: "IT O'quv Markazi" },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.7",
          ratingCount: "320",
          bestRating: "5",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Bosh sahifa",
            item: u("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Yozuv tezligi testi",
            item: u("/test"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Reyting",
            item: u("/leaderboards"),
          },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "TypeX bepulmi?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ha, TypeX butunlay bepul. Ro'yxatdan o'tish va barcha funksiyalardan foydalanish uchun hech qanday to'lov talab qilinmaydi.",
            },
          },
          {
            "@type": "Question",
            name: "Yozuv tezligini qanday o'lchash mumkin?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Berilgan matnni imkon qadar tez va xatosiz yozing. WPM (so'z/minut) va aniqlik foizi avtomatik hisoblanadi. Natijalaringizni profilingizda kuzatishingiz mumkin.",
            },
          },
          {
            "@type": "Question",
            name: "Qanday tillarda test topshirish mumkin?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Hozirda o'zbek, ingliz va rus tillarida yozuv tezligi testi topshirish mumkin. O'zbek tili uchun maxsus lug'at va matnlar mavjud.",
            },
          },
          {
            "@type": "Question",
            name: "Typing test nima va u qanday foyda beradi?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Typing test (yozuv tezligi testi) — klaviaturada yozish tezligi va aniqligingizni o'lchaydigan vosita. Muntazam mashq qilish orqali WPM ko'rsatkichingizni oshirishingiz va ish unumdorligingizni yaxshilashingiz mumkin.",
            },
          },
        ],
      },
    ],
  },

  test: {
    title: "TypeX — Yozuv tezligi testi (WPM)",
    description:
      "Bepul onlayn yozuv tezligi testi. O'zbek, ingliz va rus tillarida WPM (so'z/minut) va aniqlik foizini o'lchang. 15 soniyadan 30 daqiqagacha bo'lgan testlar. Klaviaturada tez yozishni sinab ko'ring.",
    canonical: u("/"),
  },

  about: {
    title: "TypeX — Loyiha haqida",
    description:
      "TypeX — O'zbekistonning eng zamonaviy yozuv tezligi testi platformasi. IT O'quv Markazi tomonidan yaratilgan. Bepul typing test, AI tahlil, reyting va statistika.",
    canonical: u("/about"),
  },

  leaderboards: {
    title: "TypeX — Reytinglar",
    description:
      "TypeX reyting jadvali. O'zbek, ingliz va rus tillarida eng tez yozuvchilar bilan bellashing. O'z WPM ko'rsatkichingizni butun O'zbekiston bo'ylab solishtiring.",
    canonical: u("/leaderboards"),
  },

  privacy: {
    title: "TypeX | Maxfiylik siyosati",
    description:
      "TypeX maxfiylik siyosati. Shaxsiy ma'lumotlarni qayta ishlash va himoya qilish tartibi. O'zbekiston Respublikasi qonunchiligiga muvofiq.",
    canonical: u("/privacy-policy"),
    robots: "index, follow",
  },

  terms: {
    title: "TypeX | Foydalanish shartlari",
    description:
      "TypeX platformasidan foydalanish shartlari. Foydalanuvchi huquq va majburiyatlari. O'zbekiston Respublikasi qonunchiligiga muvofiq.",
    canonical: u("/terms-of-service"),
    robots: "index, follow",
  },

  security: {
    title: "TypeX | Xavfsizlik siyosati",
    description:
      "TypeX xavfsizlik siyosati. Ma'lumotlar xavfsizligi va himoyasi bo'yicha talablar. O'zbekiston Respublikasi qonunchiligiga muvofiq.",
    canonical: u("/security-policy"),
    robots: "index, follow",
  },

  login: {
    title: "TypeX — Kirish",
    description:
      "TypeX ga kirish yoki ro'yxatdan o'tish. Natijalaringizni saqlang, reytingda qatnashing va shaxsiy profilingizni boshqaring.",
    canonical: u("/login"),
  },

  account: {
    title: "TypeX | Mening profilim",
    description: "Shaxsiy profilingiz, natijalaringiz va statistika.",
    canonical: u("/account"),
  },

  adminLogin: {
    title: "TypeX — Admin Panel",
    description: "Admin panelga kirish.",
    canonical: u("/TypeX-hq"),
  },

  adminDashboard: {
    title: "TypeX | Admin panel",
    description: "Admin panel boshqaruvi.",
    canonical: u("/TypeX-hq/dashboard"),
  },

  onboarding: {
    title: "TypeX — Sozlamalar",
    description: "TypeX platformasiga xush kelibsiz! Profilingizni sozlang.",
    canonical: u("/onboarding"),
  },

  profile: {
    title: "TypeX | Foydalanuvchi profili",
    description: "Foydalanuvchi profili va statistika.",
    canonical: u("/profile"),
  },

  "404": {
    title: "TypeX | Sahifa topilmadi (404)",
    description: "Qidirilayotgan sahifa topilmadi. Bosh sahifaga qaytish.",
    canonical: u("/404"),
  },
};

export function getSeoConfig(pageName: PageName): SeoConfig {
  return (
    seoConfig[pageName] ?? {
      title: "TypeX | Yozuv tezligi testi",
      description: "O'zbek tilidagi bepul yozuv tezligi testi.",
      canonical: u("/"),
    }
  );
}

export function updateSeo(
  pageName: PageName,
  params?: Record<string, string>,
): void {
  const cfg = getSeoConfig(pageName);
  const url = window.location.href;

  let title = cfg.title;
  const profileName = params?.["uidOrName"];
  if (
    pageName === "profile" &&
    profileName !== undefined &&
    profileName !== ""
  ) {
    title = `${profileName} | TypeX — Foydalanuvchi profili`;
  }

  document.title = title;

  setMeta("description", cfg.description);
  setMeta("robots", cfg.robots ?? "index, follow");
  setMeta("keywords", buildKeywords(pageName));

  setMeta("og:title", cfg.ogTitle ?? cfg.title);
  setMeta("og:description", cfg.ogDescription ?? cfg.description);
  setMeta("og:url", url);
  setMeta("og:image", cfg.ogImage ?? DEFAULT_OG_IMAGE);
  setMeta("og:type", "website");
  setMeta("og:site_name", "TypeX");
  setMeta("og:locale", "uz_UZ");

  setMeta("twitter:title", cfg.ogTitle ?? cfg.title);
  setMeta("twitter:description", cfg.ogDescription ?? cfg.description);
  setMeta("twitter:image", cfg.ogImage ?? DEFAULT_OG_IMAGE);
  setMeta("twitter:card", "summary_large_image");

  setCanonical(cfg.canonical);
  setHreflang(cfg.canonical);
  setJsonLd(cfg.jsonLd);
}

function setMeta(name: string, content: string): void {
  const isProperty = name.startsWith("og:") || name.startsWith("twitter:");
  const attr = isProperty ? "property" : "name";
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (el) {
    el.content = content;
  } else {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    el.content = content;
    document.head.appendChild(el);
  }
}

function setCanonical(href: string): void {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (el) {
    el.href = href;
  } else {
    el = document.createElement("link");
    el.rel = "canonical";
    el.href = href;
    document.head.appendChild(el);
  }
}

function setHreflang(canonical: string): void {
  const langs = [
    { hreflang: "uz", href: canonical },
    { hreflang: "en", href: canonical.replace("typex.uz", "en.typex.uz") },
    { hreflang: "ru", href: canonical.replace("typex.uz", "ru.typex.uz") },
    { hreflang: "x-default", href: canonical },
  ];
  for (const link of qsa('link[rel="alternate"][hreflang]')) {
    link.remove();
  }
  for (const lang of langs) {
    const el = document.createElement("link");
    el.rel = "alternate";
    el.setAttribute("hreflang", lang.hreflang);
    el.href = lang.href;
    document.head.appendChild(el);
  }
}

function qsa(sel: string): HTMLElement[] {
  return Array.from(document.querySelectorAll(sel));
}

function setJsonLd(data: Record<string, unknown>[] | undefined): void {
  const existing = document.querySelectorAll("#seo-jsonld");
  for (const el of existing) el.remove();
  if (!data || data.length === 0) return;
  const script = document.createElement("script");
  script.id = "seo-jsonld";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data.length === 1 ? data[0] : data);
  document.head.appendChild(script);
}

function buildKeywords(pageName: string): string {
  const base =
    "TypeX, yozuv tezligi testi, typing test, klaviaturada tez yozish, wpm test, tez yozish, o'zbekcha typing, onlayn test, bepul";
  const specific: Record<string, string> = {
    landing:
      "yozuv tezligi testi o'zbek, typing test uzbek, klaviatura tezligi, matn terish tezligi, 10 barmoq yozish, tez yozishni o'rganish",
    test: "wpm test o'zbek, yozuv tezligini o'lchash, typing speed test, tez yozish testi online, so'z/minut hisoblash",
    about:
      "TypeX haqida, loyiha, it o'quv markazi, yozuv tezligi platformasi, o'zbek typing sayti",
    leaderboards:
      "reyting, eng tez yozuvchilar, leaderboard, typing reytingi, eng yaxshi natijalar",
  };
  return `${specific[pageName] ?? ""}, ${base}`;
}

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

const BASE_URL = "https://typeuz.uz";
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/typeuzsocial.png`;

function u(path: string): string {
  return `${BASE_URL}${path}`;
}

export const seoConfig: Record<string, SeoConfig> = {
  landing: {
    title: "TypeUZ | O'zbek tilidagi yozuv tezligi testi — bepul onlayn typing test",
    description:
      "O'zbek tilidagi eng zamonaviy yozuv tezligi testi. WPM va aniqlikni o'lchang, reytingda yuksaling, do'stlaringiz bilan bellashing. Bepul, ro'yxatsiz sinab ko'ring! Klaviaturada tez yozishni o'rganing.",
    canonical: u("/"),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "TypeUZ",
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
          { "@type": "ListItem", position: 1, name: "Bosh sahifa", item: u("/") },
          { "@type": "ListItem", position: 2, name: "Yozuv tezligi testi", item: u("/test") },
          { "@type": "ListItem", position: 3, name: "Reyting", item: u("/leaderboards") },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "TypeUZ bepulmi?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ha, TypeUZ butunlay bepul. Ro'yxatdan o'tish va barcha funksiyalardan foydalanish uchun hech qanday to'lov talab qilinmaydi.",
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
    title: "TypeUZ | Yozuv tezligi testi — WPM va aniqlikni o'lchang",
    description:
      "Bepul onlayn yozuv tezligi testi. O'zbek, ingliz va rus tillarida WPM (so'z/minut) va aniqlik foizini o'lchang. 15 soniyadan 30 daqiqagacha bo'lgan testlar. Klaviaturada tez yozishni sinab ko'ring.",
    canonical: u("/test"),
  },

  about: {
    title: "TypeUZ | Loyiha haqida — O'zbek tilidagi typing test platformasi",
    description:
      "TypeUZ — O'zbekistonning eng zamonaviy yozuv tezligi testi platformasi. IT O'quv Markazi tomonidan yaratilgan. Bepul typing test, AI tahlil, reyting va statistika.",
    canonical: u("/about"),
  },

  leaderboards: {
    title: "TypeUZ | Reyting — Eng tez yozuvchilar",
    description:
      "TypeUZ reyting jadvali. O'zbek, ingliz va rus tillarida eng tez yozuvchilar bilan bellashing. O'z WPM ko'rsatkichingizni butun O'zbekiston bo'ylab solishtiring.",
    canonical: u("/leaderboards"),
  },

  privacy: {
    title: "TypeUZ | Maxfiylik siyosati",
    description:
      "TypeUZ maxfiylik siyosati. Shaxsiy ma'lumotlarni qayta ishlash va himoya qilish tartibi. O'zbekiston Respublikasi qonunchiligiga muvofiq.",
    canonical: u("/privacy-policy"),
    robots: "index, follow",
  },

  terms: {
    title: "TypeUZ | Foydalanish shartlari",
    description:
      "TypeUZ platformasidan foydalanish shartlari. Foydalanuvchi huquq va majburiyatlari. O'zbekiston Respublikasi qonunchiligiga muvofiq.",
    canonical: u("/terms-of-service"),
    robots: "index, follow",
  },

  security: {
    title: "TypeUZ | Xavfsizlik siyosati",
    description:
      "TypeUZ xavfsizlik siyosati. Ma'lumotlar xavfsizligi va himoyasi bo'yicha talablar. O'zbekiston Respublikasi qonunchiligiga muvofiq.",
    canonical: u("/security-policy"),
    robots: "index, follow",
  },

  login: {
    title: "TypeUZ | Kirish — Ro'yxatdan o'tish",
    description:
      "TypeUZ ga kirish yoki ro'yxatdan o'tish. Natijalaringizni saqlang, reytingda qatnashing va shaxsiy profilingizni boshqaring.",
    canonical: u("/login"),
    robots: "noindex, follow",
  },

  account: {
    title: "TypeUZ | Mening profilim",
    description: "Shaxsiy profilingiz, natijalaringiz va statistika.",
    canonical: u("/account"),
    robots: "noindex, follow",
  },

  adminLogin: {
    title: "TypeUZ | Admin panel — Kirish",
    description: "Admin panelga kirish.",
    canonical: u("/typeuz-hq"),
    robots: "noindex, nofollow",
  },

  adminDashboard: {
    title: "TypeUZ | Admin panel",
    description: "Admin panel boshqaruvi.",
    canonical: u("/typeuz-hq/dashboard"),
    robots: "noindex, nofollow",
  },

  onboarding: {
    title: "TypeUZ | Kirish — Sozlamalar",
    description: "TypeUZ platformasiga xush kelibsiz! Profilingizni sozlang.",
    canonical: u("/onboarding"),
    robots: "noindex, follow",
  },

  profile: {
    title: "TypeUZ | Foydalanuvchi profili",
    description: "Foydalanuvchi profili va statistika.",
    canonical: u("/profile"),
    robots: "noindex, follow",
  },

  "404": {
    title: "TypeUZ | Sahifa topilmadi (404)",
    description: "Qidirilayotgan sahifa topilmadi. Bosh sahifaga qaytish.",
    canonical: u("/404"),
    robots: "noindex, follow",
  },
};

export function getSeoConfig(pageName: PageName): SeoConfig {
  return (
    seoConfig[pageName] ?? {
      title: "TypeUZ | Yozuv tezligi testi",
      description: "O'zbek tilidagi bepul yozuv tezligi testi.",
      canonical: u("/"),
    }
  );
}

export function updateSeo(pageName: PageName, params?: Record<string, string>): void {
  const cfg = getSeoConfig(pageName);
  const url = window.location.href;

  let title = cfg.title;
  const profileName = params?.["uidOrName"];
  if (pageName === "profile" && profileName !== undefined && profileName !== "") {
    title = `${profileName} | TypeUZ — Foydalanuvchi profili`;
  }

  document.title = title;

  setMeta("description", cfg.description);
  setMeta("robots", cfg.noindex ? "noindex, nofollow" : cfg.robots ?? "index, follow");
  setMeta("keywords", buildKeywords(pageName));

  setMeta("og:title", cfg.ogTitle ?? cfg.title);
  setMeta("og:description", cfg.ogDescription ?? cfg.description);
  setMeta("og:url", url);
  setMeta("og:image", cfg.ogImage ?? DEFAULT_OG_IMAGE);
  setMeta("og:type", "website");
  setMeta("og:site_name", "TypeUZ");
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
    { hreflang: "en", href: canonical.replace("typeuz.uz", "en.typeuz.uz") },
    { hreflang: "ru", href: canonical.replace("typeuz.uz", "ru.typeuz.uz") },
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
  const base = "typeuz, yozuv tezligi testi, typing test, klaviaturada tez yozish, wpm test, tez yozish, o'zbekcha typing, onlayn test, bepul";
  const specific: Record<string, string> = {
    landing: "yozuv tezligi testi o'zbek, typing test uzbek, klaviatura tezligi, matn terish tezligi, 10 barmoq yozish, tez yozishni o'rganish",
    test: "wpm test o'zbek, yozuv tezligini o'lchash, typing speed test, tez yozish testi online, so'z/minut hisoblash",
    about: "typeuz haqida, loyiha, it o'quv markazi, yozuv tezligi platformasi, o'zbek typing sayti",
    leaderboards: "reyting, eng tez yozuvchilar, leaderboard, typing reytingi, eng yaxshi natijalar",
  };
  return `${specific[pageName] ?? ""}, ${base}`;
}

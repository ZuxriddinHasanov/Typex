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
    title:
      "TypeX | O'zbek tilidagi yozuv tezligi testi — bepul onlayn typing test",
    description:
      "O'zbek tilidagi eng zamonaviy yozuv tezligi testi. WPM va aniqlikni o'lchang, reytingda yuksaling, do'stlaringiz bilan bellashing. Bepul, ro'yxatsiz sinab ko'ring! Klaviaturada tez yozishni o'rganing.",
    canonical: u("/"),
jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "TypeX",
        alternateName: "typex.uz",
        url: BASE_URL,
        description: "O'zbek tilidagi eng zamonaviy yozuv tezligi testi (Typing Test). WPM va aniqlikni o'lchash platformasi.",
        applicationCategory: "EducationalApplication",
        operatingSystem: "All",
        author: {
          "@type": "Person",
          name: "Zuxriddin Hasanov"
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD"
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "1050",
          bestRating: "5"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "TypeX",
        url: BASE_URL,
        logo: `${BASE_URL}/images/logo.png`,
        founder: {
          "@type": "Person",
          name: "Zuxriddin Hasanov"
        },
        sameAs: [
          "https://t.me/typeuz",
          "https://instagram.com/typex_uz"
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "TypeX",
        url: BASE_URL,
        description: "O'zbek tilidagi yozuv tezligi testi platformasi.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${BASE_URL}/profile/{search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "TypeX o'zi nima?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "TypeX — klaviaturada yozish tezligini va aniqligini o'lchash, oshirish hamda o'zbek tilida raqobatlashish uchun mo'ljallangan onlayn platforma."
            }
          },
          {
            "@type": "Question",
            name: "WPM va Accuracy nima?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "WPM (Words Per Minute) — bir daqiqada to'g'ri yozilgan so'zlar sonini bildiradi. Accuracy — sizning yozishdagi aniqligingizni foizlarda ko'rsatadi."
            }
          }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Bosh sahifa",
            item: BASE_URL
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Test",
            item: `${BASE_URL}/test`
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Reyting",
            item: `${BASE_URL}/leaderboards`
          }
        ]
      }
    ]
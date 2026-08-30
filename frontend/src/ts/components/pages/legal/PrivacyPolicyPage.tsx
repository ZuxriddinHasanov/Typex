// oxlint-disable react/no-unescaped-entities
import { For, JSXElement } from "solid-js";

import { Fa } from "../../common/Fa";

const sections = [
  {
    id: "data-collection",
    icon: "fa-database",
    title: "Qanday ma'lumotlarni yig'amiz?",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>TypeUZ quyidagi shaxsiy ma'lumotlarni yig'adi:</p>
        <ul class="list-inside list-disc space-y-1.5 pl-2">
          <li>Elektron pochta manzili</li>
          <li>Foydalanuvchi nomi</li>
          <li>Yoshingiz va jinsingiz (ixtiyoriy)</li>
          <li>Tanlangan avatar</li>
          <li>Har bir yozish testi natijalari (WPM, aniqlik, vaqt, matn)</li>
          <li>Saytdagi sozlamalaringiz (til, mavzu, vaqt)</li>
          <li>Testlarni boshlash va yakunlash statistikasi</li>
          <li>Saytda o'tkazilgan umumiy vaqt</li>
        </ul>
        <p class="mt-4 font-semibold text-text">
          TypeUZ QUYIDAGILARNI yig'MAYDI:
        </p>
        <ul class="list-inside list-disc space-y-1.5 pl-2">
          <li>
            Maxsus matnlar (faqat brauzeringizning lokal xotirasida saqlanadi)
          </li>
          <li>To'lov ma'lumotlari (platforma butunlay bepul)</li>
          <li>Joylashuv ma'lumotlari</li>
          <li>Kontaktlar ro'yxati</li>
        </ul>
        <p class="mt-4 text-sub/70 italic">
          Agar yuqoridagi ro'yxatlarda biror ma'lumot turi yetishmayotgan deb
          hisoblasangiz, biz bilan bog'lanishingiz mumkin.
        </p>
      </div>
    ),
  },
  {
    id: "how-collected",
    icon: "fa-info-circle",
    title: "Ma'lumotlar qanday yig'iladi?",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>
          Ma'lumotlarning ko'p qismini to'g'ridan-to'g'ri siz taqdim etasiz. Biz
          ma'lumotlarni quyidagi hollarda yig'amiz va qayta ishlaymiz:
        </p>
        <ul class="list-inside list-disc space-y-1.5 pl-2">
          <li>
            Ro'yxatdan o'tganingizda (email, foydalanuvchi nomi, yosh, jins)
          </li>
          <li>Yozish testini yakunlaganingizda (natijalar, WPM, aniqlik)</li>
          <li>Profil ma'lumotlaringizni o'zgartirganingizda</li>
        </ul>
      </div>
    ),
  },
  {
    id: "data-usage",
    icon: "fa-chart-bar",
    title: "Ma'lumotlardan qanday foydalanamiz?",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>
          TypeUZ ma'lumotlaringizni O'zbekiston Respublikasi qonunchiligiga
          muvofiq quyidagilar uchun qayta ishlaydi:
        </p>
        <ul class="list-inside list-disc space-y-1.5 pl-2">
          <li>Test natijalari tarixini saqlash va ko'rsatish</li>
          <li>Shaxsiy statistika va grafiklarni yaratish</li>
          <li>Sozlamalaringizni eslab qolish</li>
          <li>Yetakchilar taxtasida reytingni shakllantirish</li>
          <li>Haftalik AI tahlil natijalarini taqdim etish</li>
          <li>Platformani yaxshilash va yangi funksiyalarni ishlab chiqish</li>
        </ul>
        <p class="mt-4">
          Agar firibgarlik yoki saytdan noto'g'ri foydalanishda aniqlansangiz,
          O'zbekiston Respublikasi qonunchiligiga muvofiq, foydalanuvchi
          nomingiz va elektron pochtangizning xeshlangan nusxalarini saqlab
          qolishimiz mumkin. Bu yangi hisob yaratish orqali chetlab o'tishning
          oldini olish uchun zarur.
        </p>
      </div>
    ),
  },
  {
    id: "data-storage",
    icon: "fa-shield-alt",
    title: "Ma'lumotlarni qanday saqlaymiz?",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>
          TypeUZ ma'lumotlaringizni PostgreSQL ma'lumotlar bazasida xavfsiz
          saqlaydi. Tizim yozish tezligi, test tarixi, XP va tangalarni (🍌)
          shifrlangan holda saqlaydi. Barcha to'lov va maxfiy ma'lumotlar
          (masalan, parollar) hash qilingan holatda saqlanadi.
        </p>
        <ul class="list-inside list-disc space-y-1.5 pl-2">
          <li>bcrypt bilan xeshlanadi</li>
          <li>SSL/TLS orqali shifrlangan ulanish</li>
          <li>Muntazam xavfsizlik auditi</li>
          <li>Ruxsatsiz kirishdan himoya qilish tizimlari</li>
        </ul>
        <p class="mt-4">
          Ma'lumotlaringiz O'zbekiston Respublikasi hududida joylashgan
          serverlarda saqlanadi. Ma'lumotlarni saqlash muddati — hisobingiz faol
          bo'lgan davr va hisob o'chirilgandan keyin 30 kun.
        </p>
      </div>
    ),
  },
  {
    id: "rights",
    icon: "fa-balance-scale",
    title: "Ma'lumotlarni himoya qilish bo'yicha huquqlaringiz",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>
          O'zbekiston Respublikasining "Shaxsiy ma'lumotlar to'g'risida"gi
          Qonuniga (O'RQ-547-son, 02.10.2019) muvofiq, quyidagi huquqlarga
          egasiz:
        </p>
        <ul class="list-inside list-disc space-y-2 pl-2">
          <li>
            <strong class="text-text">Kirish huquqi</strong> – Shaxsiy
            ma'lumotlaringizni qayta ishlash holati haqida ma'lumot olish va
            ularning nusxasini talab qilish huquqi.
          </li>
          <li>
            <strong class="text-text">Tuzatish huquqi</strong> – Noto'g'ri,
            to'liq bo'lmagan yoki eskirgan ma'lumotlarni tuzatishni talab qilish
            huquqi.
          </li>
          <li>
            <strong class="text-text">O'chirish huquqi</strong> – Agar
            ma'lumotlar qayta ishlash maqsadlariga mos kelmasa yoki qonuniy
            asoslar mavjud bo'lmasa, ularni o'chirishni talab qilish huquqi.
          </li>
          <li>
            <strong class="text-text">Qayta ishlashni cheklash huquqi</strong> –
            Muayyan holatlarda ma'lumotlaringizni qayta ishlashni vaqtincha
            to'xtatishni talab qilish huquqi.
          </li>
          <li>
            <strong class="text-text">E'tiroz bildirish huquqi</strong> –
            Ma'lumotlaringizni qayta ishlashiga e'tiroz bildirish huquqi.
          </li>
          <li>
            <strong class="text-text">Ma'lumotlarni ko'chirish huquqi</strong> –
            Ma'lumotlaringizni mashina o'qiydigan formatda olish va boshqa
            operatorga o'tkazish huquqi.
          </li>
        </ul>
        <p class="mt-4">
          Huquqlaringizni amalga oshirish uchun TypexUz@gmail.com ga murojaat
          qiling. So'rovlar 30 kun ichida ko'rib chiqiladi.
        </p>
      </div>
    ),
  },
  {
    id: "analytics",
    icon: "fa-chart-line",
    title: "Analitika",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>
          Biz Google Analytics xizmatidan foydalanamiz. Bu xizmat brauzeringiz
          saytga tashrif buyurganingizda yuboriladigan ma'lumotlarni yig'adi: IP
          manzil, brauzer turi, internet-provayder, sana va vaqt,
          yo'naltiruvchi/chiqish sahifalari va sahifada o'tkazilgan vaqt.
        </p>
        <p class="font-semibold text-text">
          BU MA'LUMOTLAR SHAXSIY IDENTIFIKATSIYA QILUVCHI MA'LUMOTLARNI O'Z
          ICHIGA OLMAYDI.
        </p>
        <p>
          Google Analytics maxfiylik siyosati:{" "}
          <a
            href="https://support.google.com/analytics/answer/6004245?hl=uz"
            target="_blank"
            rel="noopener noreferrer"
            class="text-main underline hover:no-underline"
          >
            support.google.com/analytics
          </a>
        </p>
      </div>
    ),
  },
  {
    id: "cookies",
    icon: "fa-cookie-bite",
    title: "Cookie-fayllar",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>
          Cookie-fayllar – bu brauzeringizga joylashtiriladigan kichik matnli
          fayllar. TypeUZ cookie-fayllardan quyidagi maqsadlarda foydalanadi:
        </p>
        <ul class="list-inside list-disc space-y-1.5 pl-2">
          <li>Tizimga kirgan holatingizni saqlash</li>
          <li>Sozlamalaringizni eslab qolish (til, mavzu)</li>
          <li>Haftalik AI tahlil ma'lumotlarini keshlash</li>
        </ul>
        <p class="mt-4">
          Brauzeringizni cookie-fayllarni qabul qilmaslikka sozlashingiz mumkin,
          biroq ba'zi xususiyatlar ishlamasligi mumkin.
        </p>
      </div>
    ),
  },
  {
    id: "external",
    icon: "fa-link",
    title: "Boshqa veb-saytlar",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>TypeUZ boshqa veb-saytlarga havolalarni o'z ichiga olishi mumkin.</p>
        <p class="font-semibold text-text">
          Bizning maxfiylik siyosatimiz faqat typex.uz ga taalluqlidir. Boshqa
          saytlarga o'tganingizda, ularning siyosatini o'qing.
        </p>
      </div>
    ),
  },
  {
    id: "changes",
    icon: "fa-edit",
    title: "O'zgartirishlar",
    content: (
      <p class="text-base leading-relaxed text-sub">
        TypeUZ maxfiylik siyosatini O'zbekiston Respublikasi qonunchiligidagi
        o'zgarishlarga muvofiq yangilab boradi. Barcha o'zgarishlar ushbu
        sahifada e'lon qilinadi. Muhim o'zgarishlar haqida foydalanuvchilar
        email orqali xabardor qilinadi.
      </p>
    ),
  },
];

function SectionWrapper(props: { children: JSXElement }): JSXElement {
  return (
    <section class="group bg-bg-alt/50 relative overflow-hidden rounded-3xl border border-sub/10 p-8 shadow-xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-main/20 hover:shadow-2xl hover:shadow-main/10 md:p-10">
      <div class="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-main/5 blur-3xl transition-colors group-hover:bg-main/10"></div>
      <div class="prose prose-zinc dark:prose-invert relative z-10 max-w-none space-y-6">
        {props.children}
      </div>
    </section>
  );
}

export function PrivacyPolicyPage(): JSXElement {
  return (
    <div class="mx-auto mt-16 max-w-4xl px-6 pb-20">
      <header class="mb-16 space-y-4 text-center">
        <h1 class="text-5xl font-extrabold tracking-tight text-text">
          Maxfiylik <span class="text-main">siyosati</span>
        </h1>
        <p class="mx-auto max-w-2xl text-base text-sub">
          Kuchga kirgan sana: 15-iyul, 2026 &middot; Oxirgi yangilanish:
          15-iyul, 2026
        </p>
        <p class="mx-auto max-w-3xl text-sm leading-relaxed text-sub/70">
          TypeUZ (keyingi o'rinlarda "TypeUZ", "biz", "bizni") — IT o'quv
          markazi tomonidan boshqariladigan yozuv tezligi testi platformasi.
          Xizmatlarimizga ishonch bildirganingiz uchun tashakkur! Shaxsiy
          ma'lumotlaringizni himoya qilish mas'uliyatini jiddiy qabul qilamiz.
          Ushbu Maxfiylik siyosati ma'lumotlaringizni qanday qayta ishlashimizni
          tavsiflaydi va O'zbekiston Respublikasining "Shaxsiy ma'lumotlar
          to'g'risida"gi Qonuniga (O'RQ-547-son) muvofiq ishlab chiqilgan.
        </p>
      </header>

      <div class="flex flex-col gap-12">
        <For each={sections}>
          {(section) => (
            <SectionWrapper>
              <h2
                id={section.id}
                class="flex items-center gap-3 text-2xl font-bold text-text"
              >
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-main/10 text-lg text-main">
                  <Fa icon={section.icon as never} />
                </span>
                {section.title}
              </h2>
              <div>{section.content}</div>
            </SectionWrapper>
          )}
        </For>
      </div>

      <SectionWrapper>
        <h2
          id="contact"
          class="flex items-center gap-3 text-2xl font-bold text-text"
        >
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-main/10 text-lg text-main">
            <Fa icon="fa-envelope" />
          </span>
          Biz bilan bog'lanish
        </h2>
        <div class="space-y-3 text-base text-sub">
          <p>
            Agar savollaringiz bo'lsa yoki huquqlaringizni amalga oshirishni
            istasangiz, biz bilan bog'laning:
          </p>
          <p>
            Email:{" "}
            <a
              href="mailto:TypexUz@gmail.com"
              class="text-main underline hover:no-underline"
            >
              TypexUz@gmail.com
            </a>
          </p>
          <p>
            Telegram:{" "}
            <a
              href="https://t.me/typex_uz"
              class="text-main underline hover:no-underline"
            >
              @typex_uz
            </a>
          </p>
          <p>
            IT o'quv markazi
            <br />
            O'zbekiston Respublikasi
          </p>
        </div>
      </SectionWrapper>
    </div>
  );
}

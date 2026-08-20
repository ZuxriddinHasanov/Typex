import { For, JSXElement } from "solid-js";

import { Fa } from "../common/Fa";
import { TypeUZAdSlot } from "../common/TypeUZAdSlot";

export function AboutPage(): JSXElement {
  return (
    <main class="mx-auto mt-16 flex max-w-7xl flex-col gap-16 px-6 pb-24">
      {/* Hero */}
      <section id="hero" class="text-center" aria-label="Loyiha haqida">
        <h1 class="mb-6 text-4xl font-extrabold tracking-tight text-text sm:text-5xl">
          TypeX<span class="text-main">.uz</span>
        </h1>
        <p class="mx-auto max-w-2xl text-lg leading-relaxed text-sub">
          <span class="font-semibold text-text">TypeX.uz</span> &mdash;
          O&apos;zbekistonning 1-raqamli yozuv tezligi platformasi. Ushbu platformada
          O&apos;zbek, Ingliz va Rus tillarida yozish tezligingizni sinab
          ko&apos;ring, natijalaringizni AI yordamida tahlil qiling va reytingda
          yuksaling.
        </p>
      </section>

      {/* Stats */}
      <section id="statistika" class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <For
          each={[
            { value: "50,000+", label: "test", icon: "fa-keyboard" },
            { value: "3", label: "til", icon: "fa-language" },
            { value: "12,000+", label: "foydalanuvchi", icon: "fa-users" },
            { value: "98%", label: "o'rtacha aniqlik", icon: "fa-bullseye" },
          ]}
        >
          {(item) => (
            <div class="group rounded-2xl border border-sub/10 bg-bg/50 p-6 text-center backdrop-blur-sm transition-all hover:border-main/20 hover:shadow-lg hover:shadow-main/5">
              <div class="text-3xl font-extrabold text-main">{item.value}</div>
              <div class="mt-2 flex items-center justify-center gap-2 text-base text-sub">
                <Fa icon={item.icon as never} class="text-main/60" />
                {item.label}
              </div>
            </div>
          )}
        </For>
      </section>

      <TypeUZAdSlot slotId="ad-about-1" class="mx-auto w-full max-w-3xl" />

      {/* How it works */}
      <section
        id="qanday-ishlaydi"
        class="rounded-2xl border border-sub/10 bg-bg/50 p-8 backdrop-blur-sm"
      >
        <h2 class="mb-6 text-2xl font-bold text-text">Qanday ishlaydi?</h2>
        <div class="grid gap-5 sm:grid-cols-2">
          <For
            each={[
              {
                icon: "fa-keyboard",
                text: "Berilgan matnni imkon qadar tez va xatosiz yozing",
              },
              {
                icon: "fa-chart-bar",
                text: "WPM (so'z/minut) va aniqlik foizi real vaqtda hisoblanadi",
              },
              {
                icon: "fa-user-check",
                text: "Ro'yxatdan o'tib barcha natijalaringizni saqlang va kuzating",
              },
              {
                icon: "fa-trophy",
                text: "Reytingda boshqa foydalanuvchilar bilan bellashing",
              },
              {
                icon: "fa-robot",
                text: "AI tahlil orqali kuchsiz tomonlaringizni aniqlang",
              },
              {
                icon: "fa-cog",
                text: "Sozlamalarni o'zingizga moslang — til, vaqt, mavzu",
              },
            ]}
          >
            {(item) => (
              <div class="flex items-start gap-3">
                <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-main/10 text-sm text-main">
                  <Fa icon={item.icon as never} />
                </div>
                <p class="text-base leading-relaxed text-sub">{item.text}</p>
              </div>
            )}
          </For>
        </div>
      </section>

      {/* History */}
      <section
        id="tariximiz"
        class="rounded-2xl border border-sub/10 bg-bg/50 p-8 backdrop-blur-sm"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-main/10 text-lg text-main">
            <Fa icon="fa-history" />
          </div>
          <h2 class="text-2xl font-bold text-text">Tariximiz</h2>
        </div>
        <div class="mt-6 space-y-4 text-base leading-relaxed text-sub">
          <p>
            <span class="font-semibold text-text">TypeX.uz</span> 2024-yilda
            tashkil etilgan. Maqsad &mdash; O&apos;zbekiston yoshlariga
            klaviaturada tez va to&apos;g&apos;ri yozish ko&apos;nikmasini
            shakllantirishda yordam berish.
          </p>
          <p>
            Birgina shaxsiy loyiha sifatida boshlangan TypeX.uz, bugungi kunda{" "}
            <span class="font-semibold text-text">12 000+</span> foydalanuvchiga
            ega platformaga aylandi. O&apos;zbek, Ingliz va Rus tillaridagi
            testlar, AI yordamida haftalik tahlil va interaktiv reyting tizimi
            orqali foydalanuvchilarimiz o&apos;z ko&apos;nikmalarini muntazam
            oshirib borishmoqda.
          </p>
          <p>
            Bizning vazifamiz — O&apos;zbekistonda raqamli savodxonlikni
            oshirish va yosh avlodga zamonaviy texnologiyalar bilan ishlash
            ko&apos;nikmasini singdirish.
          </p>
        </div>
      </section>

      {/* Features */}
      <section
        id="xususiyatlar"
        class="rounded-2xl border border-sub/10 bg-bg/50 p-8 backdrop-blur-sm"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-main/10 text-lg text-main">
            <Fa icon="fa-star" />
          </div>
          <h2 class="text-2xl font-bold text-text">Imkoniyatlar</h2>
        </div>
        <div class="mt-6 grid gap-4 sm:grid-cols-2">
          <For
            each={[
              {
                icon: "fa-language",
                title: "Ko'p tilli qo'llab-quvvatlash",
                text: "O'zbek, Ingliz va Rus tillarida matnlar. Har bir til alohida statistikaga ega.",
              },
              {
                icon: "fa-tachometer-alt",
                title: "Real vaqt WPM",
                text: "Yozish jarayonida so'z/minut ko'rsatkichi real vaqtda yangilanadi.",
              },
              {
                icon: "fa-crosshairs",
                title: "Aniqlik tahlili",
                text: "Har bir testdan so'ng xatolar tahlili va aniqlik foizi ko'rsatiladi.",
              },
              {
                icon: "fa-trophy",
                title: "Reyting va leaderboard",
                text: "Barcha foydalanuvchilar orasida o'z o'rningizni ko'ring va raqobatlashing.",
              },
              {
                icon: "fa-chart-line",
                title: "Shaxsiy statistika",
                text: "Kunlik, haftalik va oylik progressni grafik va diagrammalarda kuzating.",
              },
              {
                icon: "fa-pen",
                title: "Maxsus matn rejimi",
                text: "O'zingizning matningizni kiriting yoki mavjud mavzulardan birini tanlang.",
              },
              {
                icon: "fa-moon",
                title: "Qorong'i va yorug' mavzu",
                text: "Ko'zingizga qulay mavzuni tanlang — dark va light rejimlari mavjud.",
              },
              {
                icon: "fa-keyboard",
                title: "Klaviatura yorliqlari",
                text: "Barcha asosiy amallar klaviatura orqali bajariladi — tez va qulay.",
              },
              {
                icon: "fa-mobile-alt",
                title: "Mobil qurilmalar",
                text: "Telefon va planshetlarda ham mukammal ishlaydi. Har qanday qurilmada sinab ko'ring.",
              },
            ]}
          >
            {(item) => (
              <div class="flex items-start gap-4 rounded-xl border border-sub/10 bg-bg/30 p-5 backdrop-blur-sm transition-all hover:border-main/20 hover:shadow-sm hover:shadow-main/5">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-main/10 text-base text-main">
                  <Fa icon={item.icon as never} />
                </div>
                <div>
                  <h3 class="font-semibold text-text">{item.title}</h3>
                  <p class="mt-1 text-base leading-relaxed text-sub">
                    {item.text}
                  </p>
                </div>
              </div>
            )}
          </For>
        </div>
      </section>

      <TypeUZAdSlot slotId="ad-about-2" class="mx-auto w-full max-w-3xl" />

      {/* AI Weekly Analysis */}
      <section
        id="ai-tahlil"
        class="rounded-2xl border border-main/10 bg-bg/50 p-8 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center text-center sm:flex-row sm:gap-6 sm:text-left">
          <div class="mb-4 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-main text-2xl text-bg sm:mb-0">
            <Fa icon="fa-brain" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-text">Haftalik AI tahlil</h2>
            <p class="mt-2 text-base leading-relaxed text-sub">
              Sun&apos;iy intellekt yozish odatlaringizni tahlil qiladi va
              shaxsiy tavsiyalar beradi.
            </p>
          </div>
        </div>
        <div class="mt-8 grid gap-5 sm:grid-cols-3">
          <For
            each={[
              {
                icon: "fa-microchip",
                title: "Aqlli tahlil",
                text: "AI har hafta yozish tezligingiz, xatolaringiz va progressingizni chuqur tahlil qiladi.",
              },
              {
                icon: "fa-lightbulb",
                title: "Shaxsiy tavsiyalar",
                text: "Kuchsiz tomonlaringizni aniqlab, ularni yaxshilash uchun mashqlar taklif etadi.",
              },
              {
                icon: "fa-chart-line",
                title: "Progress kuzatuvi",
                text: "Haftalar va oylar bo'yicha o'sish dinamikangizni batafsil ko'rib boring.",
              },
            ]}
          >
            {(item) => (
              <div class="rounded-xl border border-sub/10 bg-bg/30 p-6 text-center backdrop-blur-sm transition-all hover:border-main/20 hover:shadow-sm hover:shadow-main/5 sm:text-left">
                <div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-main/10 text-base text-main sm:mx-0">
                  <Fa icon={item.icon as never} />
                </div>
                <h3 class="font-semibold text-text">{item.title}</h3>
                <p class="mt-1 text-sm leading-relaxed text-sub">{item.text}</p>
              </div>
            )}
          </For>
        </div>
        <div class="mt-6 rounded-xl border border-sub/10 bg-bg/30 p-5 text-center backdrop-blur-sm">
          <p class="text-base leading-relaxed text-sub">
            <Fa icon="fa-info-circle" class="mr-1 inline text-main/60" />
            AI tahlil xizmati ro&apos;yxatdan o&apos;tgan foydalanuvchilar uchun
            mavjud. Profilingizga kiring va haftalik hisobotlarni oling.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        class="rounded-2xl border border-sub/10 bg-bg/50 p-8 backdrop-blur-sm"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-main/10 text-lg text-main">
            <Fa icon="fa-question-circle" />
          </div>
          <h2 class="text-2xl font-bold text-text">
            Ko&apos;p beriladigan savollar
          </h2>
        </div>
        <div class="mt-6 space-y-5">
          <For
            each={[
              {
                q: "TypeX.uz kimniki va uning asoschisi kim?",
                a: "TypeX.uz platformasi o'zbek dasturchisi Zuxriddin Hasanov tomonidan asos solingan. Sayt butunlay mustaqil va notijorat loyiha hisoblanadi.",
              },
              {
                q: "TypeX.uz nima?",
                a: "TypeX.uz — Zuxriddin Hasanov tomonidan yaratilgan bepul yozuv tezligi testi. O'zbek, Ingliz va Rus tillarida yozish tezligi va aniqligini o'lchash imkonini beradi.",
              },
              {
                q: "TypeX.uz bepulmi?",
                a: "Ha, TypeX.uz to'liq bepul. Barcha asosiy funksiyalar, jumladan AI tahlil va reyting tizimi hech qanday to'lov talab qilmaydi.",
              },
              {
                q: "Qanday tillar mavjud?",
                a: "Hozirda O'zbek, Ingliz va Rus tillari qo'llab-quvvatlanadi. Har bir til uchun alohida testlar va statistika yuritiladi.",
              },
              {
                q: "Natijalarimni qanday saqlashim mumkin?",
                a: "Ro'yxatdan o'tish orqali barcha test natijalaringiz avtomatik saqlanadi. Shuningdek, har bir testdan so'ng screenshot orqali natijangizni do'stlaringiz bilan ulashishingiz mumkin.",
              },
              {
                q: "AI tahlil qanday ishlaydi?",
                a: "Har hafta yakunida AI tizimi sizning test natijalaringizni tahlil qiladi, progress va xatolar statistikasini chiqaradi va shaxsiy tavsiyalar tayyorlaydi. Bu xizmat faqat ro'yxatdan o'tgan foydalanuvchilar uchun mavjud.",
              },
              {
                q: "Mobile qurilmalarda ishlaydimi?",
                a: "Ha, TypeX.uz barcha zamonaviy brauzerlar va mobil qurilmalar bilan to'liq mos keladi. Telefon, planshet va kompyuterlardan bemalol foydalanishingiz mumkin.",
              },
            ]}
          >
            {(item) => (
              <details class="group rounded-xl border border-sub/10 bg-bg/30 p-4 backdrop-blur-sm transition-colors hover:border-main/20">
                <summary class="flex cursor-pointer items-center justify-between font-medium text-text">
                  <span>{item.q}</span>
                  <Fa
                    icon="fa-chevron-down"
                    class="text-xs text-sub transition-transform group-open:rotate-180"
                  />
                </summary>
                <p class="mt-3 text-base leading-relaxed text-sub">{item.a}</p>
              </details>
            )}
          </For>
        </div>
      </section>

      {/* CTA */}
      <section
        id="boshlash"
        class="rounded-2xl bg-gradient-to-br from-main to-main/80 p-10 text-center text-bg"
      >
        <h2 class="text-3xl font-bold">Tezlikni sinab ko&apos;ring</h2>
        <p class="mx-auto mt-3 max-w-lg text-base leading-relaxed text-bg/80">
          Ro&apos;yxatdan o&apos;tmasdan ham testni boshlashingiz mumkin.
          Natijalaringizni saqlash va AI tahlil olish uchun esa bir daqiqada
          profilingizni yarating.
        </p>
        <a
          href="/"
          class="mt-6 inline-flex items-center gap-2 rounded-xl bg-bg px-8 py-3 font-semibold text-main transition-transform hover:scale-105"
        >
          Testni boshlash
          <Fa icon="fa-arrow-right" class="text-sm" />
        </a>
      </section>
    </main>
  );
}

// oxlint-disable react/no-unescaped-entities
import { For, JSXElement } from "solid-js";

import { AnimatedSection } from "../../common/AnimatedSection";
import { Fa } from "../../common/Fa";

const sections = [
  {
    icon: "fa-handshake",
    title: "1. Kelishuv",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>
          typeuz.uz saytiga kirish orqali siz ushbu Foydalanish shartlariga
          rioya qilishga rozilik bildirasiz. Ushbu shartlar O'zbekiston
          Respublikasi Fuqarolik Kodeksi va O'zbekiston Respublikasining
          "Axborotlashtirish to'g'risida"gi Qonuniga muvofiq ishlab chiqilgan.
        </p>
        <p class="font-semibold text-text">
          AGAR USHBU SHARTLARNING BARCHASIGA ROZI BO'LMASANGIZ, XIZMATLARIMIZDAN
          FOYDALANISH TAQIQLANADI.
        </p>
      </div>
    ),
  },
  {
    icon: "fa-lock",
    title: "2. Hisob xavfsizligi",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>
          Siz hisobingiz xavfsizligi va hisobingizdagi barcha harakatlar uchun
          mas'ulsiz. Parolingizni maxfiy saqlashingiz shart. Hisobingizdan
          ruxsatsiz foydalanilganligini aniqlasangiz, darhol bizga xabar bering.
        </p>
        <p>TypeUZ hisobingizdagi ruxsatsiz harakatlar uchun javobgar emas.</p>
      </div>
    ),
  },
  {
    icon: "fa-ban",
    title: "3. Foydalanish cheklovlari",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p class="font-semibold text-text">
          Saytdan foydalanishda quyidagilar TAQIQLANADI:
        </p>
        <ol class="list-inside list-decimal space-y-1.5 pl-2">
          <li>
            Noqonuniy yoki noqonuniy faoliyatni targ'ib qiluvchi kontent
            joylashtirish
          </li>
          <li>Shahvoniy, odobsiz yoki zo'ravonlikka undovchi kontent</li>
          <li>Tuhmat, haqorat yoki firibgarlik maqsadidagi harakatlar</li>
          <li>Jins, irq, millat, din yoki boshqa asoslarda kamsitish</li>
          <li>
            Boshqa foydalanuvchilarning shaxsiy ma'lumotlarini roziliksiz
            to'plash va tarqatish
          </li>
          <li>
            Zararli dasturlarni tarqatish yoki platformadan hujum uchun
            foydalanish
          </li>
          <li>
            Botlar, avtomatlashtirilgan vositalar yoki cheat dasturlaridan
            foydalanish
          </li>
          <li>
            Serverlarni ortiqcha yuklash yoki ularning ishlashiga xalaqit berish
          </li>
          <li>Boshqa shaxsni soxta tarzda namoyish etish</li>
          <li>Ma'lumotlarni avtomatik yig'ish (scraping)</li>
        </ol>
      </div>
    ),
  },
  {
    icon: "fa-copyright",
    title: "4. Intellektual mulk",
    content: (
      <p class="text-base leading-relaxed text-sub">
        TypeUZ platformasi, uning dizayni, logotipi va kontenti mualliflik
        huquqi bilan himoyalangan. TypeUZ nomi va logotipidan oldindan yozma
        ruxsatsiz foydalanish taqiqlanadi.
      </p>
    ),
  },
  {
    icon: "fa-user-slash",
    title: "5. Hisobni o'chirish",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>
          TypeUZ quyidagi hollarda hisobingizni oldindan ogohlantirmasdan
          o'chirish yoki bloklash huquqiga ega:
        </p>
        <ul class="list-inside list-disc space-y-1.5 pl-2">
          <li>Ushbu shartlarni buzganingizda</li>
          <li>Firibgarlik yoki aldashda aniqlanganingizda</li>
          <li>Platformadan noqonuniy maqsadlarda foydalanganingizda</li>
        </ul>
        <p class="mt-4">
          Siz istalgan vaqtda profilingiz orqali hisobingizni o'chirishingiz
          mumkin. Hisob o'chirilgandan keyin barcha shaxsiy ma'lumotlaringiz 30
          kun ichida o'chiriladi.
        </p>
      </div>
    ),
  },
  {
    icon: "fa-shield-alt",
    title: "6. Maxfiylik siyosati",
    content: (
      <p class="text-base leading-relaxed text-sub">
        Xizmatlarimizdan foydalanish orqali siz{" "}
        <a
          href="/privacy-policy"
          class="text-main underline hover:no-underline"
          router-link
        >
          Maxfiylik siyosatimiz
        </a>{" "}
        shartlarini ham qabul qilasiz. Ma'lumotlaringiz qanday yig'ilishi,
        saqlanishi va himoya qilinishi haqida batafsil ma'lumot olish uchun
        Maxfiylik siyosatimizni o'qing.
      </p>
    ),
  },
  {
    icon: "fa-exclamation-triangle",
    title: "7. Kafolatlar rad etilishi",
    content: (
      <p class="text-base leading-relaxed text-sub">
        TYPEUZ XIZMATLARNI "MAVJUD HOLATDA" TAQDIM ETADI. QONUN TOMONIDAN RUXSAT
        ETILGAN MAKSIMAL DARAJADA, TYPEUZ HAR QANDAY KAFOLATLARNI, SHU JUMLADAN
        SOTISHGA YAROQLILIK VA MUAYYAN MAQSADGA MUVOFIQLIK KAFOLATLARINI RAD
        ETADI. USHBU RAD ETISH O'ZBEKISTON RESPUBLIKASI FUQAROLIK KODEKSIGA
        MUVOFIQ AMALGA OSHIRILADI.
      </p>
    ),
  },
  {
    icon: "fa-link",
    title: "8. Havolalar",
    content: (
      <p class="text-base leading-relaxed text-sub">
        TypeUZ boshqa veb-saytlarga havolalarni o'z ichiga olishi mumkin. Biz
        bog'langan saytlarning mazmuni va xavfsizligi uchun javobgar emasmiz.
      </p>
    ),
  },
  {
    icon: "fa-edit",
    title: "9. O'zgartirishlar",
    content: (
      <p class="text-base leading-relaxed text-sub">
        TypeUZ ushbu Foydalanish shartlarini O'zbekiston Respublikasi
        qonunchiligidagi o'zgarishlarga muvofiq yangilab boradi. Muhim
        o'zgarishlar haqida foydalanuvchilar email orqali xabardor qilinadi.
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

export function TermsOfServicePage(): JSXElement {
  return (
    <div class="mx-auto mt-16 flex max-w-6xl flex-col gap-16 px-6 pb-24">
      <section class="text-center">
        <div class="mb-4">
          <span class="text-5xl font-extrabold tracking-tight text-text">
            Foydalanish <span class="text-main">shartlari</span>
          </span>
        </div>
        <p class="mx-auto max-w-xl text-sm text-sub/70">
          Ushbu foydalanish shartlari oxirgi marta 15-iyul, 2026 da yangilangan.
        </p>
      </section>

      <For each={sections}>
        {(section) => (
          <AnimatedSection>
            <SectionWrapper>
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-main/10 text-lg text-main">
                  <Fa icon={section.icon as never} />
                </div>
                <h2 class="text-2xl font-bold text-text">{section.title}</h2>
              </div>
              <div class="mt-6">{section.content}</div>
            </SectionWrapper>
          </AnimatedSection>
        )}
      </For>

      <AnimatedSection>
        <SectionWrapper>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-main/10 text-lg text-main">
              <Fa icon="fa-envelope" />
            </div>
            <h2 class="text-2xl font-bold text-text">10. Bog'lanish</h2>
          </div>
          <div class="mt-6 space-y-3 text-base text-sub">
            <p>Savollaringiz bo'lsa, biz bilan bog'laning:</p>
            <p>
              Email:{" "}
              <a
                href="mailto:zuhriddin.h.011@gmail.com"
                class="text-main underline hover:no-underline"
              >
                zuhriddin.h.011@gmail.com
              </a>
            </p>
            <p>
              Telegram:{" "}
              <a
                href="https://t.me/root_v7be"
                class="text-main underline hover:no-underline"
              >
                @root_v7be
              </a>
            </p>
            <p>
              IT o'quv markazi
              <br />
              O'zbekiston Respublikasi
            </p>
          </div>
        </SectionWrapper>
      </AnimatedSection>
    </div>
  );
}

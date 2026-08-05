// oxlint-disable react/no-unescaped-entities
import { For, JSXElement } from "solid-js";
import { Fa } from "../../common/Fa";

const sections = [
  {
    icon: "fa-bug",
    title: "Zaiflikni qanday xabar qilish kerak",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>TypeUZ xavfsizligi va yaxlitligini juda jiddiy qabul qilamiz. Agar platformamizda zaiflik topgan bo'lsangiz, iltimos, uni imkon qadar tezroq bizga xabar qiling. Sizning hisobotingiz platformamizni xavfsizroq qilishga yordam beradi.</p>
        <p>Zaiflikni xabar qilish uchun quyidagi manzilga yozing:</p>
        <p><a href="mailto:contact@typeuz.uz" class="text-main underline hover:no-underline">contact@typeuz.uz</a></p>
        <p class="mt-4 font-semibold text-text">Iltimos, xabaringizga quyidagi ma'lumotlarni kiriting:</p>
        <ul class="list-inside list-disc space-y-1.5 pl-2">
          <li><strong class="text-text">Zaiflik tavsifi</strong> — qayerda va qanday zaiflik topilgani</li>
          <li><strong class="text-text">Qayta tiklash usuli (Proof of Concept)</strong> — zaiflikni qanday takrorlash mumkin</li>
          <li><strong class="text-text">Ta'sir darajasi</strong> — zaiflik qanday oqibatlarga olib kelishi mumkin</li>
          <li><strong class="text-text">Skrinshotlar yoki video</strong> — zaiflikni ko'rsatuvchi dalillar</li>
          <li><strong class="text-text">Brauzer va qurilma ma'lumotlari</strong> — versiyalar, operatsion tizim</li>
        </ul>
        <p class="mt-4">Barcha hisobotlar maxfiy tarzda ko'rib chiqiladi.</p>
      </div>
    ),
  },
  {
    icon: "fa-tasks",
    title: "Hisobot topshirish qoidalari",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p class="font-semibold text-text">Zaifliklarni tekshirish va hisobot qilishda quyidagi qoidalarga rioya qiling:</p>
        <ul class="list-inside list-disc space-y-1.5 pl-2">
          <li><strong class="text-text">DoS hujumlaridan saqlaning</strong> — Xizmat ko'rsatishni rad etish (DoS) holatiga olib keladigan faoliyatlar bilan shug'ullanmang.</li>
          <li><strong class="text-text">Boshqa foydalanuvchilar ma'lumotlariga kirmang</strong> — Faqat o'zingizning test hisoblaringizdan foydalaning.</li>
          <li><strong class="text-text">Production muhitida sinov o'tkazmang</strong> — Zaifliklarni ishlab chiqarish muhitida emas, balki nazariy tarzda tasvirlang.</li>
          <li><strong class="text-text">Ma'lumotlarni oshkor qilmang</strong> — Zaiflik bartaraf etilgunga qadar uni boshqalarga oshkor qilmang.</li>
          <li><strong class="text-text">Avtomatlashtirilgan skanerlardan foydalanmang</strong> — Ruxsatsiz avtomatik skanerlash va zaifliklarni qidirish taqiqlanadi.</li>
        </ul>
      </div>
    ),
  },
  {
    icon: "fa-clock",
    title: "Javob berish muddatlari",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p>Biz barcha hisobotlarni quyidagi muddatlarda ko'rib chiqamiz:</p>
        <ul class="list-inside list-disc space-y-1.5 pl-2">
          <li><strong class="text-text">Dastlabki javob:</strong> 72 soat ichida</li>
          <li><strong class="text-text">Zaiflikni tasdiqlash:</strong> 5 ish kuni ichida</li>
          <li><strong class="text-text">Zaiflikni bartaraf etish:</strong> Zaiflik darajasiga qarab 7-30 kun</li>
        </ul>
        <p class="mt-4">Zaiflik bartaraf etilgandan so'ng, sizning hisobotingiz uchun minnatdorchilik bildiramiz va sizni xavfsizlik bo'yicha maxsus ro'yxatga kiritamiz (agar xohlasangiz).</p>
      </div>
    ),
  },
  {
    icon: "fa-shield-alt",
    title: "Xavfsizlik choralarimiz",
    content: (
      <div class="space-y-4 text-base leading-relaxed text-sub">
        <p class="font-semibold text-text">TypeUZ quyidagi xavfsizlik choralarini amalga oshiradi:</p>
        <ul class="list-inside list-disc space-y-1.5 pl-2">
          <li><strong class="text-text">Parollar xeshlanib saqlanadi</strong> — bcrypt algoritmi bilan, ochiq holda hech qachon</li>
          <li><strong class="text-text">SSL/TLS shifrlash</strong> — Barcha ulanishlar HTTPS orqali shifrlanadi</li>
          <li><strong class="text-text">Muntazam xavfsizlik auditlari</strong> — Kod va infrastruktura doimiy tekshiriladi</li>
          <li><strong class="text-text">Ruxsatsiz kirish himoyasi</strong> — Rate limiting, WAF, suspicious activity monitoring</li>
          <li><strong class="text-text">Ma'lumotlar yedeklash</strong> — Kunlik avtomatik backup, geografik razdiska</li>
        </ul>
        <p class="mt-4">Ma'lumotlar O'zbekiston Respublikasi hududida joylashgan serverlarda saqlanadi.</p>
      </div>
    ),
  },
];

function SectionWrapper(props: { children: JSXElement }): JSXElement {
  return (
    <section class="prose prose-zinc dark:prose-invert max-w-none space-y-6">
      {props.children}
    </section>
  );
}

export function SecurityPolicyPage(): JSXElement {
  return (
    <div class="mx-auto mt-16 max-w-4xl px-6 pb-20">
      <header class="mb-16 text-center space-y-4">
        <h1 class="text-5xl font-extrabold tracking-tight text-text">Xavfsizlik <span class="text-main">siyosati</span></h1>
        <p class="mx-auto max-w-2xl text-base text-sub">
          TypeUZ xavfsizlik siyosati — zaifliklarni qanday hisobot qilish va xavfsizlik masalalari.
        </p>
        <p class="mx-auto max-w-3xl text-sm leading-relaxed text-sub/70">
          Platformamiz xavfsizligini ta'minlash — ustuvor vazifamiz. Agar xavfsizlik zaifligi topgan bo'lsangiz, quyidagi yo'llar bilan bizga xabar berishingiz mumkin.
        </p>
      </header>

      <div class="flex flex-col gap-12">
        <For each={sections}>
          {(section) => (
            <SectionWrapper>
              <h2 class="flex items-center gap-3 text-2xl font-bold text-text">
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
    </div>
  );
}

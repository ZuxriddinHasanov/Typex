// oxlint-disable react/no-unknown-property
// oxlint-disable react/no-unescaped-entities
import {
  JSXElement,
  onMount,
  createSignal,
  createResource,
  createEffect,
  For,
  Show,
} from "solid-js";
import { envConfig } from "virtual:env-config";

import type { FaSolidIcon } from "../../../types/font-awesome";

import { cn } from "../../../utils/cn";
import { AnimatedSection } from "../../common/AnimatedSection";
import { Fa } from "../../common/Fa";
import { TypeXAdSlot } from "../../common/TypeXAdSlot";

function FeatureCard(props: {
  icon: FaSolidIcon;
  title: string;
  desc: string;
}): JSXElement {
  return (
    <div class="group relative flex flex-col items-center gap-6 overflow-hidden rounded-3xl border border-sub/10 bg-gradient-to-b from-bg/80 to-bg/40 p-14 text-center backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:border-main/30 hover:bg-bg/90 hover:shadow-2xl hover:shadow-main/10">
      <div class="absolute -inset-2 bg-gradient-to-tr from-main/0 via-main/0 to-main/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
      <div class="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-main/20 to-main/5 text-4xl text-main shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
        <Fa icon={props.icon} />
      </div>
      <h3 class="relative text-2xl font-bold tracking-tight text-text transition-colors duration-300 group-hover:text-main">
        {props.title}
      </h3>
      <p class="relative max-w-sm text-lg leading-relaxed text-sub/90">
        {props.desc}
      </p>
    </div>
  );
}

function StatsCard(props: {
  value: string;
  label: string;
  targetValue?: number;
}): JSXElement {
  const [displayValue, setDisplayValue] = createSignal("0");
  const [hasAnimated, setHasAnimated] = createSignal(false);
  const [isVisible, setIsVisible] = createSignal(false);
  const [cardRef, setCardRef] = createSignal<HTMLDivElement | undefined>(
    undefined,
  );

  createEffect(() => {
    const el = cardRef();
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !hasAnimated()) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    onMount(() => () => observer.disconnect());
  });

  createEffect(() => {
    if (isVisible() && !hasAnimated()) {
      const target =
        props.targetValue ??
        (parseInt(props.value.replace(/[^0-9]/g, "")) || 0);
      const suffix = props.value.replace(/[0-9]/g, "");
      const duration = 1500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(target * eased);
        setDisplayValue(current.toLocaleString() + suffix);
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
      setHasAnimated(true);
    }
  });

  return (
    <div ref={setCardRef} class="flex flex-col items-center gap-1">
      <span class="text-3xl font-bold text-main tabular-nums">
        {displayValue()}
      </span>
      <span class="text-sm text-sub">{props.label}</span>
    </div>
  );
}

function StepCard(props: {
  step: string;
  icon: FaSolidIcon;
  title: string;
  desc: string;
}): JSXElement {
  return (
    <div class="group flex flex-col items-center gap-5 text-center transition-all duration-500 hover:-translate-y-2">
      <div class="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-main/20 bg-bg shadow-lg transition-colors duration-500 group-hover:border-main/50 group-hover:bg-main/5">
        <span class="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-main text-sm font-bold text-bg shadow-md transition-transform duration-300 group-hover:scale-110">
          {props.step}
        </span>
        <div class="text-2xl text-main transition-transform duration-500 group-hover:scale-110">
          <Fa icon={props.icon} />
        </div>
      </div>
      <h3 class="text-xl font-bold tracking-tight text-text">{props.title}</h3>
      <p class="max-w-xs text-lg leading-relaxed text-sub/90">{props.desc}</p>
    </div>
  );
}

function TypingHeroAnimation() {
  const words =
    "Kelajakni oldindan ko'rishning eng yaxshi yo'li uni yaratishdir...".split(
      " ",
    );
  const [typedIndex, setTypedIndex] = createSignal(0);
  const [currentWordCharIndex, setCurrentWordCharIndex] = createSignal(0);
  const [wpm, setWpm] = createSignal(0);

  createEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const typeNext = () => {
      if (typedIndex() < words.length) {
        const word = words[typedIndex()];
        if (word !== undefined && currentWordCharIndex() < word.length) {
          setCurrentWordCharIndex((c) => c + 1);
          setWpm((w) => Math.min(124, w + Math.floor(Math.random() * 5) + 2));
          timeout = setTimeout(typeNext, 40 + Math.random() * 80);
        } else {
          setTypedIndex((i) => i + 1);
          setCurrentWordCharIndex(0);
          timeout = setTimeout(typeNext, 100 + Math.random() * 100);
        }
      } else {
        timeout = setTimeout(() => {
          setTypedIndex(0);
          setCurrentWordCharIndex(0);
          setWpm(0);
          typeNext();
        }, 3000);
      }
    };

    timeout = setTimeout(typeNext, 1000);
    return () => clearTimeout(timeout);
  });

  return (
    <div class="relative flex w-full flex-col overflow-hidden bg-bg/95 font-mono text-sm shadow-inner sm:text-lg">
      {/* Code Editor Line Numbers & Content */}
      <div class="flex min-h-[16rem] p-6">
        {/* Line Numbers */}
        <div class="flex hidden flex-col border-r border-sub/10 pr-4 text-right text-sub-alt/40 select-none sm:flex">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>

        {/* Typing Content */}
        <div class="flex-1 pl-0 sm:pl-4">
          <div class="flex flex-wrap gap-[0.2em] leading-relaxed font-medium tracking-wide">
            <For each={words}>
              {(word, i) => (
                <span
                  class={cn(
                    "relative transition-colors duration-200",
                    i() < typedIndex() ? "text-main" : "text-sub/40",
                  )}
                >
                  <Show when={i() === typedIndex()} fallback={word}>
                    <span class="text-text">
                      {word.substring(0, currentWordCharIndex())}
                    </span>
                    <span class="text-sub/40">
                      {word.substring(currentWordCharIndex())}
                    </span>
                    <span
                      class="absolute top-[10%] h-[80%] w-[2px] animate-pulse bg-main"
                      style={{
                        left: `calc(${currentWordCharIndex()} * 0.55em)`,
                      }}
                    ></span>
                  </Show>
                </span>
              )}
            </For>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div class="flex items-center justify-between border-t border-sub/10 bg-sub-alt/20 px-4 py-3">
        <div class="flex gap-6">
          <div class="flex flex-col">
            <div class="text-[10px] tracking-widest text-sub/70 uppercase">
              WPM
            </div>
            <div class="text-xl font-bold text-main tabular-nums">{wpm()}</div>
          </div>
          <div class="flex flex-col">
            <div class="text-[10px] tracking-widest text-sub/70 uppercase">
              ACC
            </div>
            <div class="text-xl font-bold text-text">98%</div>
          </div>
        </div>
        <div class="flex items-center gap-2 rounded-full border border-main/20 bg-main/10 px-3 py-1 text-xs font-semibold text-main">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-main"></span>
          Live typing
        </div>
      </div>
    </div>
  );
}

export function LandingPage(): JSXElement {
  const [heroVisible, setHeroVisible] = createSignal(false);

  const [siteContent] = createResource(
    () => "fetch",
    async () => {
      try {
        const res = await fetch(`${envConfig.backendUrl}/public/site-content`);
        if (!res.ok) return null;
        const json = (await res.json()) as { data: unknown };
        return json.data as {
          hero: { title: string; subtitle: string; description: string };
          features: Array<{ icon: string; title: string; description: string }>;
          aboutCards: Array<{
            icon: string;
            title: string;
            description: string;
          }>;
          footer: { brandName: string; tagline: string; telegram: string };
        };
      } catch {
        return null;
      }
    },
  );

  const hero = () => siteContent()?.hero;
  const features = () => siteContent()?.features;

  onMount(() => {
    setTimeout(() => setHeroVisible(true), 100);
  });

  return (
    <main class="flex flex-col items-center">
      {/* Hero */}
      <section class="relative flex min-h-[90vh] w-full flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-48">
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-b from-main/[0.02] via-bg to-transparent"></div>

        <div class="z-10 mt-12 flex w-full max-w-7xl flex-col items-center gap-24 lg:mt-0 lg:flex-row lg:justify-between lg:gap-8">
          {/* Left Column - Text & CTA */}
          <div class="flex max-w-2xl flex-col items-center text-center lg:items-start lg:text-left">
            

            <h1
              class={cn(
                "mb-4 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-text transition-all duration-1000 ease-out",
                heroVisible()
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0",
              )}
              style={{ "line-height": "1.15" }}
            >
              {hero()?.title?.split(" ")[0] ?? "Tez yozishni"}
              <br />
              <span class="text-main drop-shadow-sm">
                {hero()?.subtitle ?? "o'rganing"}
              </span>
            </h1>

            <p
              class={cn(
                "mt-6 max-w-xl text-lg leading-relaxed text-sub transition-all delay-200 duration-1000 ease-out",
                heroVisible()
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0",
              )}
            >
              {hero()?.description ??
                "O'z yozuv tezligingizni sinab ko'ring, reytingda yuksaling va do'stlaringiz bilan bellashing. Bugunoq boshlang!"}
            </p>

            <div
              class={cn(
                "mt-10 flex flex-wrap justify-center gap-4 transition-all delay-400 duration-1000 ease-out lg:justify-start",
                heroVisible()
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0",
              )}
            >
              <a
                href="/test"
                class="inline-flex items-center gap-2 rounded-full bg-main px-8 py-4 text-base font-bold text-bg transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-main/30"
                router-link
              >
                Testni boshlash
                <Fa icon="fa-keyboard" />
              </a>
              <a
                href="/leaderboards"
                class="inline-flex items-center gap-2 rounded-full border-2 border-sub/20 bg-transparent px-8 py-4 text-base font-bold text-sub transition-all hover:border-main/50 hover:text-main"
                router-link
              >
                Reytingni ko'rish
              </a>
            </div>
          </div>

          {/* Right Column - Animation / Graphic */}
          <div
            class={cn(
              "relative w-full max-w-lg transition-all delay-300 duration-1200 ease-out lg:w-1/2",
              heroVisible()
                ? "translate-x-0 opacity-100"
                : "translate-x-12 opacity-0",
            )}
          >
            <div class="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-main/30 to-transparent blur-2xl"></div>
            <div class="relative overflow-hidden rounded-2xl border border-sub/10 bg-bg/80 p-1 shadow-2xl backdrop-blur-md">
              {/* Window Header */}
              <div class="flex items-center gap-2 border-b border-sub/10 bg-sub-alt/50 px-4 py-3">
                <div class="flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f56]"></div>
                <div class="flex h-3 w-3 items-center justify-center rounded-full bg-[#ffbd2e]"></div>
                <div class="flex h-3 w-3 items-center justify-center rounded-full bg-[#27c93f]"></div>
                <div class="mr-auto ml-auto flex items-center gap-2 text-xs font-semibold text-sub/70">
                  <Fa icon="fa-lock" class="text-[10px]" />
                  typex.uz
                </div>
              </div>
              {/* Window Content */}
              <TypingHeroAnimation />
            </div>
          </div>
        </div>
        <div class="z-10 mt-20 flex w-full max-w-4xl flex-col items-center empty:hidden">
          <TypeXAdSlot slotId="ad-landing-hero" class="mx-auto w-full" />
        </div>
      </section>

      {/* How it works */}
      <AnimatedSection
        animationClass="scroll-fade"
        class="mt-24 flex w-full max-w-6xl flex-col items-center gap-20 px-6 pb-32"
      >
        <div class="flex flex-col items-center gap-6 text-center">
          <div class="rounded-full border border-main/20 bg-main/10 px-6 py-2 text-sm font-black tracking-widest text-main uppercase shadow-inner">
            Qanday ishlaydi
          </div>
          <h2 class="bg-gradient-to-r from-text to-sub bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
            Uch qadamda boshlang
          </h2>
        </div>
        <div class="relative mt-8 grid w-full grid-cols-1 gap-16 sm:grid-cols-3">
          {/* Connecting line */}
          <div class="absolute top-12 right-[16%] left-[16%] hidden h-[2px] bg-gradient-to-r from-main/0 via-main/20 to-main/0 sm:block"></div>

          <StepCard
            step="1"
            icon="fa-cog"
            title="Sozlamalarni tanlang"
            desc="Vaqt, til va kontent turini o'zingizga moslab oling"
          />
          <StepCard
            step="2"
            icon="fa-keyboard"
            title="Yozishni boshlang"
            desc="Berilgan matnni iloji boricha tez va aniq yozing"
          />
          <StepCard
            step="3"
            icon="fa-chart-line"
            title="Natijalarni ko'ring"
            desc="WPM, aniqlik va reytingdagi o'rningizni bilib oling"
          />
        </div>
      </AnimatedSection>

      {/* Features */}
      <AnimatedSection
        animationClass="scroll-fade"
        class="flex w-full max-w-7xl flex-col items-center gap-12 px-6 pb-32"
      >
        <div class="mb-6 flex flex-col items-center gap-4 text-center">
          <h2 class="bg-gradient-to-r from-text to-sub bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
            Platforma imkoniyatlari
          </h2>
          <p class="max-w-2xl text-xl leading-relaxed text-sub">
            Biz sizga eng zamonaviy, tez va professional typing tajribasini
            taqdim etamiz
          </p>
        </div>
        <div class="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <For
            each={
              features() ?? [
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
              ]
            }
          >
            {(f) => (
              <AnimatedSection animationClass="scroll-scale">
                <FeatureCard
                  icon={(f.icon || "fa-star") as FaSolidIcon}
                  title={f.title}
                  desc={f.description}
                />
              </AnimatedSection>
            )}
          </For>
        </div>
      </AnimatedSection>

      {/* Stats */}
      <AnimatedSection
        animationClass="scroll-fade"
        class="flex w-full flex-col items-center gap-12 border-y border-sub/10 bg-gradient-to-b from-transparent via-main/[0.02] to-transparent px-6 py-32"
      >
        <div class="mb-8 flex flex-col items-center gap-4 text-center">
          <h2 class="text-4xl font-extrabold tracking-tight text-text sm:text-5xl">
            Platforma raqamlarda
          </h2>
          <p class="max-w-xl text-lg text-sub/90">
            TypeX.uz kundan-kunga o'sib, o'zbek tilidagi eng katta typing
            maydoniga aylanmoqda
          </p>
        </div>
        <div class="grid grid-cols-2 gap-12 sm:grid-cols-4">
          <StatsCard
            value="12,000+"
            label="Foydalanuvchilar"
            targetValue={12000}
          />
          <StatsCard
            value="85,000+"
            label="Testlar bajarilgan"
            targetValue={85000}
          />
          <StatsCard value="45 WPM" label="O'rtacha tezlik" targetValue={45} />
          <StatsCard value="100+" label="Tillar" targetValue={100} />
        </div>
      </AnimatedSection>

      {/* FAQ */}
      <AnimatedSection
        animationClass="scroll-fade"
        class="flex w-full max-w-5xl flex-col items-center gap-12 px-6 py-32"
      >
        <h2 class="bg-gradient-to-r from-text to-sub bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
          Ko'p beriladigan savollar
        </h2>
        <div class="flex w-full flex-col gap-4">
          <details class="group rounded-2xl border border-sub/10 bg-bg/50 p-5 transition-colors hover:border-main/20">
            <summary class="flex cursor-pointer items-center justify-between font-medium text-text">
              TypeX.uz bepulmi?
              <span class="text-sub transition-transform group-open:rotate-180">
                <Fa icon="fa-chevron-down" />
              </span>
            </summary>
            <p class="mt-3 pb-2 text-base leading-relaxed text-sub">
              Ha, TypeX.uz butunlay bepul. Ro'yxatdan o'tish va barcha
              funksiyalardan foydalanish uchun hech qanday to'lov talab
              qilinmaydi.
            </p>
          </details>
          <details class="group rounded-2xl border border-sub/10 bg-bg/50 p-5 transition-colors hover:border-main/20">
            <summary class="flex cursor-pointer items-center justify-between font-medium text-text">
              Natijalarim qayerda saqlanadi?
              <span class="text-sub transition-transform group-open:rotate-180">
                <Fa icon="fa-chevron-down" />
              </span>
            </summary>
            <p class="mt-3 pb-2 text-base leading-relaxed text-sub">
              Ro'yxatdan o'tgan foydalanuvchilarning barcha natijalari
              profilingizda saqlanadi va istalgan vaqtda ko'rish mumkin.
            </p>
          </details>
          <details class="group rounded-2xl border border-sub/10 bg-bg/50 p-5 transition-colors hover:border-main/20">
            <summary class="flex cursor-pointer items-center justify-between font-medium text-text">
              Qanday tillar mavjud?
              <span class="text-sub transition-transform group-open:rotate-180">
                <Fa icon="fa-chevron-down" />
              </span>
            </summary>
            <p class="mt-3 pb-2 text-base leading-relaxed text-sub">
              TypeX platformasida jahondagi deyarli barcha tillarda (O'zbek, Ingliz, Rus va boshqa yuzlab tillar) test topshirishingiz mumkin!
            </p>
          </details>
          <details class="group rounded-2xl border border-sub/10 bg-bg/50 p-5 transition-colors hover:border-main/20">
            <summary class="flex cursor-pointer items-center justify-between font-medium text-text">
              Sozlamalarni qayerdan o'zgartiraman?
              <span class="text-sub transition-transform group-open:rotate-180">
                <Fa icon="fa-chevron-down" />
              </span>
            </summary>
            <p class="mt-3 pb-2 text-base leading-relaxed text-sub">
              Istalgan vaqtda klaviaturangizdagi <strong class="text-main">Esc</strong> tugmasini bosib sozlamalar menyusini ochishingiz va o'zingizga moslashtirishingiz mumkin.
            </p>
          </details>
        </div>
      </AnimatedSection>

      {/* CTA */}
      <AnimatedSection
        animationClass="scroll-fade"
        class="flex w-full flex-col items-center px-6 pt-8 pb-24 text-center"
      >
        <div class="max-w-4xl">
          <h2 class="mb-4 text-5xl font-bold text-text">Bugun boshlang</h2>
          <p class="mb-8 text-base leading-relaxed text-sub">
            Ro'yxatdan o'ting va natijalaringizni kuzatishni, reytingda
            yuksalishni boshlang
          </p>
          <a
            href="/login"
            class="inline-flex items-center gap-2 rounded-full bg-main px-10 py-4 text-base font-semibold text-bg transition-all hover:scale-105 hover:shadow-lg hover:shadow-main/25"
            router-link
          >
            Ro'yxatdan o'tish
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </a>
        </div>
      </AnimatedSection>
    </main>
  );
}


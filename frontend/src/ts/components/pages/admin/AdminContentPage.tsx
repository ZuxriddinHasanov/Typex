// oxlint-disable react/no-unescaped-entities, solid/prefer-show, typescript/no-explicit-any, typescript/strict-boolean-expressions, curly, dot-notation, no-unnecessary-type-assertion, typescript/no-unsafe-assignment, typescript/no-unsafe-member-access, typescript/no-unsafe-call, typescript/no-unsafe-return, typescript/no-unsafe-argument, eslint/prefer-template, eslint/no-unused-vars
import { createQuery } from "@tanstack/solid-query";
import { JSXElement, createSignal, For, createEffect } from "solid-js";

import Ape from "../../../ape";
import {
  showErrorNotification,
  showSuccessNotification,
} from "../../../states/notifications";
import { Fa } from "../../common/Fa";
import { AdminLayout } from "./AdminLayout";

function Input(props: {
  value: string;
  onInput: (v: string) => void;
  placeholder?: string;
  class?: string;
}): JSXElement {
  return (
    <input aria-label="Input field"
      value={props.value}
      onInput={(e) => props.onInput(e.currentTarget.value)}
      placeholder={props.placeholder}
      class={`w-full rounded-xl bg-sub-alt p-3 text-sm text-text ring-1 ring-sub/20 outline-none focus:ring-main${props.class ? " " + props.class : ""}`}
    />
  );
}

function Textarea(props: {
  value: string;
  onInput: (v: string) => void;
  rows?: number;
  label?: string;
}): JSXElement {
  return (
    <div>
      {props.label && (
        <label class="mb-1 block text-sm font-medium text-text">
          {props.label}
        </label>
      )}
      <textarea
        value={props.value}
        onInput={(e) => props.onInput(e.currentTarget.value)}
        rows={props.rows ?? 4}
        class="w-full resize-y rounded-xl bg-sub-alt p-3 text-sm text-text ring-1 ring-sub/20 outline-none focus:ring-main"
      ></textarea>
    </div>
  );
}

export function AdminContentPage(): JSXElement {
  const [heroTitle, setHeroTitle] = createSignal("");
  const [heroSubtitle, setHeroSubtitle] = createSignal("");
  const [heroDesc, setHeroDesc] = createSignal("");
  const [features, setFeatures] = createSignal<any[]>([]);
  const [aboutCards, setAboutCards] = createSignal<any[]>([]);
  const [footerBrand, setFooterBrand] = createSignal("");
  const [footerTagline, setFooterTagline] = createSignal("");
  const [footerTelegram, setFooterTelegram] = createSignal("");

  const [legalPrivacy, setLegalPrivacy] = createSignal("");
  const [legalTerms, setLegalTerms] = createSignal("");
  const [legalSecurity, setLegalSecurity] = createSignal("");

  const contentQuery = createQuery(() => ({
    queryKey: ["admin", "content"],
    queryFn: async () => {
      const res = await Ape.admin.getSiteContent();
      return res.status === 200 ? (res.body.data as any) : null;
    },
  }));

  const legalQuery = createQuery(() => ({
    queryKey: ["admin", "legal"],
    queryFn: async () => {
      const res = await Ape.admin.getLegalContent();
      return res.status === 200 ? (res.body.data as any) : null;
    },
  }));

  createEffect(() => {
    const c = contentQuery.data;
    if (c) {
      if (c.hero) {
        setHeroTitle(c.hero.title ?? "");
        setHeroSubtitle(c.hero.subtitle ?? "");
        setHeroDesc(c.hero.description ?? "");
      }
      if (c.features) setFeatures(c.features);
      if (c.aboutCards) setAboutCards(c.aboutCards);
      if (c.footer) {
        setFooterBrand(c.footer.brandName ?? "");
        setFooterTagline(c.footer.tagline ?? "");
        setFooterTelegram(c.footer.telegram ?? "");
      }
    }
  });

  createEffect(() => {
    const l = legalQuery.data;
    if (l) {
      if (l.privacy?.content) setLegalPrivacy(l.privacy.content);
      if (l.terms?.content) setLegalTerms(l.terms.content);
      if (l.security?.content) setLegalSecurity(l.security.content);
    }
  });

  const saveContent = async () => {
    try {
      await Ape.admin.updateSiteContent({
        body: {
          hero: {
            title: heroTitle(),
            subtitle: heroSubtitle(),
            description: heroDesc(),
          },
          features: features(),
          aboutCards: aboutCards(),
          footer: {
            brandName: footerBrand(),
            tagline: footerTagline(),
            telegram: footerTelegram(),
          },
        } as any,
      });
      showSuccessNotification("Kontent saqlandi");
    } catch {
      showErrorNotification("Xatolik");
    }
  };

  const saveLegal = async () => {
    try {
      await Ape.admin.updateLegalContent({
        body: {
          privacy: { title: "Maxfiylik siyosati", content: legalPrivacy() },
          terms: { title: "Foydalanish shartlari", content: legalTerms() },
          security: { title: "Xavfsizlik siyosati", content: legalSecurity() },
        },
      });
      showSuccessNotification("Yuridik kontent saqlandi");
    } catch {
      showErrorNotification("Xatolik");
    }
  };

  const addFeature = () =>
    setFeatures([
      ...features(),
      { icon: "fa-star", title: "", description: "" },
    ]);
  const updateFeature = (i: number, f: string, v: string) => {
    const copy = [...features()];
    copy[i] = { ...copy[i], [f]: v };
    setFeatures(copy);
  };
  const removeFeature = (i: number) =>
    setFeatures(features().filter((_, idx) => idx !== i));

  const addCard = () =>
    setAboutCards([
      ...aboutCards(),
      { icon: "fa-star", title: "", description: "" },
    ]);
  const updateCard = (i: number, f: string, v: string) => {
    const copy = [...aboutCards()];
    copy[i] = { ...copy[i], [f]: v };
    setAboutCards(copy);
  };
  const removeCard = (i: number) =>
    setAboutCards(aboutCards().filter((_, idx) => idx !== i));

  return (
    <AdminLayout active="content" title="Kontent boshqaruvi">
      {/* Hero */}
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">Hero</h2>
          <div class="flex flex-col gap-3">
            <Input
              value={heroTitle()}
              onInput={setHeroTitle}
              placeholder="Sarlavha"
            />
            <Input
              value={heroSubtitle()}
              onInput={setHeroSubtitle}
              placeholder="Kichik sarlavha"
            />
            <Input
              value={heroDesc()}
              onInput={setHeroDesc}
              placeholder="Ta'rif"
            />
          </div>
        </div>

        <div class="rounded-2xl border border-sub/10 bg-bg/60 p-5">
          <h2 class="mb-4 text-sm font-bold text-text">Footer</h2>
          <div class="flex flex-col gap-3">
            <Input
              value={footerBrand()}
              onInput={setFooterBrand}
              placeholder="Brand nomi"
            />
            <Input
              value={footerTagline()}
              onInput={setFooterTagline}
              placeholder="Shior"
            />
            <Input
              value={footerTelegram()}
              onInput={setFooterTelegram}
              placeholder="Telegram link"
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div class="mt-6 rounded-2xl border border-sub/10 bg-bg/60 p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-bold text-text">Features</h2>
          <button
            type="button"
            onClick={addFeature}
            class="rounded-lg bg-sub-alt px-3 py-1.5 text-xs text-sub hover:text-text"
          >
            <Fa icon="fa-plus" class="mr-1" />
            Qo'shish
          </button>
        </div>
        <div class="flex flex-col gap-3">
          <For each={features()}>
            {(f, i) => (
              <div class="flex items-start gap-2 rounded-lg bg-sub-alt/30 p-3">
                <div class="flex flex-1 flex-col gap-2">
                  <Input
                    value={f.icon}
                    onInput={(v) => updateFeature(i(), "icon", v)}
                    placeholder="Icon"
                  />
                  <Input
                    value={f.title}
                    onInput={(v) => updateFeature(i(), "title", v)}
                    placeholder="Sarlavha"
                  />
                  <Input
                    value={f.description}
                    onInput={(v) => updateFeature(i(), "description", v)}
                    placeholder="Ta'rif"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFeature(i())}
                  class="mt-1 rounded-lg bg-error/20 p-2 text-error hover:bg-error hover:text-bg"
                >
                  <Fa icon="fa-times" />
                </button>
              </div>
            )}
          </For>
        </div>
      </div>

      {/* About cards */}
      <div class="mt-6 rounded-2xl border border-sub/10 bg-bg/60 p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-sm font-bold text-text">About kartochkalari</h2>
          <button
            type="button"
            onClick={addCard}
            class="rounded-lg bg-sub-alt px-3 py-1.5 text-xs text-sub hover:text-text"
          >
            <Fa icon="fa-plus" class="mr-1" />
            Qo'shish
          </button>
        </div>
        <div class="flex flex-col gap-3">
          <For each={aboutCards()}>
            {(c, i) => (
              <div class="flex items-start gap-2 rounded-lg bg-sub-alt/30 p-3">
                <div class="flex flex-1 flex-col gap-2">
                  <Input
                    value={c.icon}
                    onInput={(v) => updateCard(i(), "icon", v)}
                    placeholder="Icon"
                  />
                  <Input
                    value={c.title}
                    onInput={(v) => updateCard(i(), "title", v)}
                    placeholder="Sarlavha"
                  />
                  <Input
                    value={c.description}
                    onInput={(v) => updateCard(i(), "description", v)}
                    placeholder="Ta'rif"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeCard(i())}
                  class="mt-1 rounded-lg bg-error/20 p-2 text-error hover:bg-error hover:text-bg"
                >
                  <Fa icon="fa-times" />
                </button>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button
          type="button"
          onClick={saveContent}
          class="rounded-xl bg-main px-6 py-3 text-sm font-bold text-bg hover:opacity-90"
        >
          <Fa icon="fa-save" class="mr-2" />
          Kontentni saqlash
        </button>
      </div>

      {/* Legal pages */}
      <div class="mt-8 rounded-2xl border border-sub/10 bg-bg/60 p-5">
        <h2 class="mb-4 text-sm font-bold text-text">Yuridik sahifalar</h2>
        <p class="mb-4 text-xs text-sub">
          Maxfiylik siyosati, Foydalanish shartlari va Xavfsizlik siyosati
          matnlari.
        </p>
        <div class="flex flex-col gap-4">
          <Textarea
            label="Maxfiylik siyosati"
            value={legalPrivacy()}
            onInput={setLegalPrivacy}
            rows={5}
          />
          <Textarea
            label="Foydalanish shartlari"
            value={legalTerms()}
            onInput={setLegalTerms}
            rows={5}
          />
          <Textarea
            label="Xavfsizlik siyosati"
            value={legalSecurity()}
            onInput={setLegalSecurity}
            rows={5}
          />
        </div>
        <div class="mt-4 flex justify-end">
          <button
            type="button"
            onClick={saveLegal}
            class="rounded-xl bg-main px-6 py-3 text-sm font-bold text-bg hover:opacity-90"
          >
            <Fa icon="fa-save" class="mr-2" />
            Yuridik kontentni saqlash
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

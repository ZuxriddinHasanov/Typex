import { useQuery } from "@tanstack/solid-query";
import { JSXElement, Show } from "solid-js";
import Ape from "../../ape";
import { cn } from "../../utils/cn";

type SlotId = "ad-result" | "ad-about-1" | "ad-about-2" | "ad-account-1" | "ad-account-2" | "ad-landing-hero" | "ad-leaderboard";

const sizeStyles: Record<string, string> = {
  leaderboard: "max-w-[728px] max-h-[90px]",
  banner: "max-w-[468px] max-h-[60px]",
  medium: "max-w-[300px] max-h-[250px]",
  skyscraper: "max-w-[120px] max-h-[600px]",
};

export function TypeXAdSlot(props: {
  slotId: SlotId;
  class?: string;
}): JSXElement {
  const adQuery = useQuery(() => ({
    queryKey: ["public", "ads"],
    queryFn: async () => {
      try {
        const res = await Ape.public.getAdConfig();
        if (res.status !== 200) return null;
        return res.body.data;
      } catch {
        return null;
      }
    },
    staleTime: 120_000,
    retry: false,
  }));

  const config = () => adQuery.data;

  const slot = () => {
    const c = config();
    if (!c || !c.enabled) return null;
    return c.slots.find((s) => s.slotId === props.slotId) ?? null;
  };

  return (
    <Show when={slot()}>
      {(s) => (
        <a
          href={s().targetUrl}
          target="_blank"
          rel="noreferrer noopener"
          class={cn(
            "block overflow-hidden rounded-xl border border-sub/10 bg-sub-alt/30 transition-opacity hover:opacity-90",
            s().size ? sizeStyles[s().size!] : "",
            props.class,
          )}
        >
          <img
            src={s().imageUrl}
            alt=""
            class="h-full w-full object-contain"
            loading="lazy"
            onLoad={() => {
              void Ape.public.logAdView({ body: {} });
            }}
          />
        </a>
      )}
    </Show>
  );
}

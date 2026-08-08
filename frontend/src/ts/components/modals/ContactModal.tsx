import { JSXElement } from "solid-js";

import { AnimatedModal } from "../common/AnimatedModal";

export function ContactModal(): JSXElement {
  return (
    <AnimatedModal id="Contact" modalClass="max-w-xl" title="Aloqa">
      <div class="flex flex-col gap-4 text-sub">
        <p>
          Savol, taklif yoki muammo bo&apos;lsa, quyidagi manzillar orqali
          bog&apos;laning:
        </p>
        <div class="flex flex-col gap-2 font-medium text-text">
          <p>
            Telegram:{" "}
            <a
              href="https://t.me/root_v7be"
              target="_blank"
              rel="noopener noreferrer"
              class="text-main hover:underline"
            >
              @root_v7be
            </a>
          </p>
          <p>
            Email:{" "}
            <a
              href="mailto:zuhriddin.h.011@gmail.com"
              class="text-main hover:underline"
            >
              zuhriddin.h.011@gmail.com
            </a>
          </p>
        </div>
      </div>
    </AnimatedModal>
  );
}

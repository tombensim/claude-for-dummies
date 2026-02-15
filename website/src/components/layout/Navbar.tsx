"use client";

import { useTranslations } from "next-intl";
import LanguageToggle from "@/components/ui/LanguageToggle";

export default function Navbar() {
  const t = useTranslations("Navbar");

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b-4 border-dummy-black bg-dummy-yellow">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <a
          href="#"
          className="font-[family-name:var(--font-display)] text-2xl text-dummy-black"
        >
          <span className="font-hand">{t("logoPre")}</span> <span className="text-dummy-white bg-dummy-black px-2 py-0.5 rounded">{t("logoHighlight")}</span>
        </a>

        <div className="flex items-center gap-5">
          <a
            href="#magic"
            className="hidden text-sm font-bold uppercase tracking-wide text-dummy-black transition-opacity hover:opacity-70 sm:block"
          >
            {t("magic")}
          </a>
          <a
            href="#start"
            className="hidden text-sm font-bold uppercase tracking-wide text-dummy-black transition-opacity hover:opacity-70 sm:block"
          >
            {t("start")}
          </a>
          <LanguageToggle />
        </div>
      </div>
    </nav>
  );
}

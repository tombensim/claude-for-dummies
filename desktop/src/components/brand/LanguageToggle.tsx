"use client";

import { useAppStore } from "@/lib/store";

export default function LanguageToggle() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);

  const toggleLocale = () => {
    setLocale(locale === "he" ? "en" : "he");
  };

  return (
    <button
      onClick={toggleLocale}
      className="no-drag rounded-md border-2 border-dummy-black bg-dummy-white px-3 py-1 text-sm font-bold text-dummy-black transition-colors hover:bg-dummy-black hover:text-dummy-yellow"
      aria-label="Switch language"
    >
      {locale === "he" ? "EN" : "עב"}
    </button>
  );
}

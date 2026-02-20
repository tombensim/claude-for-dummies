"use client";

import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function LanguageToggle() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const router = useRouter();

  const toggleLocale = () => {
    const next = locale === "he" ? "en" : "he";
    // Update Zustand (client-side state)
    setLocale(next);
    // Update next-intl server locale via cookie (source of truth for SSR)
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000`;
    // Re-render layout with new locale/dir
    router.refresh();
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

"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const next = locale === "he" ? "en" : "he";
    router.replace(pathname, { locale: next });
  };

  return (
    <button
      onClick={toggleLocale}
      className="rounded-md border-2 border-dummy-black bg-dummy-white px-3 py-1 text-sm font-bold text-dummy-black transition-colors hover:bg-dummy-black hover:text-dummy-yellow"
      aria-label="Switch language"
    >
      {locale === "he" ? "EN" : "עב"}
    </button>
  );
}

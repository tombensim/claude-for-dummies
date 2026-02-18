"use client";

import { useTranslations } from "next-intl";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  const t = useTranslations("App");

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <span className="text-lg font-bold text-dummy-black">
        {t("logoPre")}{" "}
        <span className="font-hand text-dummy-black">{t("logoHighlight")}</span>
      </span>
    </div>
  );
}

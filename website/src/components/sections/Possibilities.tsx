"use client";

import { useTranslations } from "next-intl";
import { Globe, AppWindow, Zap, Bot } from "lucide-react";
import FadeIn from "@/components/ui/FadeIn";
import MascotImage from "@/components/ui/MascotImage";
import Section from "@/components/layout/Section";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

export default function Possibilities() {
  const t = useTranslations("Possibilities");

  const features = [
    {
      Icon: Globe,
      name: t("websites"),
      description: t("websitesDesc"),
      className: "md:col-span-2",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-dummy-yellow-soft via-transparent to-transparent opacity-60" />
      ),
      href: "#start",
      cta: "",
    },
    {
      Icon: AppWindow,
      name: t("webapps"),
      description: t("webappsDesc"),
      className: "md:col-span-1",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-transparent to-transparent opacity-60" />
      ),
      href: "#start",
      cta: "",
    },
    {
      Icon: Zap,
      name: t("automations"),
      description: t("automationsDesc"),
      className: "md:col-span-1",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-transparent to-transparent opacity-60" />
      ),
      href: "#start",
      cta: "",
    },
    {
      Icon: Bot,
      name: t("bots"),
      description: t("botsDesc"),
      className: "md:col-span-2",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-transparent to-transparent opacity-60" />
      ),
      href: "#start",
      cta: "",
    },
  ];

  return (
    <Section id="possibilities">
      <FadeIn>
        <div className="mb-12 text-center">
          <h2 className="font-[family-name:var(--font-inter)] text-3xl font-bold text-text-primary sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-lg text-text-secondary">{t("subtitle")}</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <BentoGrid>
          {features.map((feature) => (
            <BentoCard key={feature.name} {...feature} />
          ))}
        </BentoGrid>
      </FadeIn>

      <FadeIn delay={0.5}>
        <div className="mt-12 flex justify-center">
          <div className="mascot-float">
            <MascotImage
              pose="pottery"
              alt="Mascot proudly showing off creations"
              width={140}
              height={140}
            />
          </div>
        </div>
      </FadeIn>
    </Section>
  );
}

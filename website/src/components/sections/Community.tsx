"use client";

import { useTranslations } from "next-intl";
import { Github, MessageCircle } from "lucide-react";
import FadeIn from "@/components/ui/FadeIn";
import MascotImage from "@/components/ui/MascotImage";
import Section from "@/components/layout/Section";

export default function Community() {
  const t = useTranslations("Community");

  return (
    <Section id="community" surface>
      <div className="grid items-center gap-12 md:grid-cols-2">
        <FadeIn>
          <div>
            <h2 className="font-[family-name:var(--font-inter)] text-3xl font-bold text-text-primary sm:text-4xl">
              {t("title")}
            </h2>
            <p className="mt-3 text-lg text-text-secondary">
              {t("subtitle")}
            </p>
            <p className="mt-6 text-base text-text-dim">
              {t("openSource")}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full border border-border-warm bg-bg-elevated px-6 py-2.5 text-sm font-semibold text-text-primary shadow-sm transition-all hover:border-dummy-yellow hover:shadow-md"
              >
                <MessageCircle className="h-4 w-4" />
                {t("discord")}
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full border border-border-warm bg-bg-elevated px-6 py-2.5 text-sm font-semibold text-text-primary shadow-sm transition-all hover:border-dummy-yellow hover:shadow-md"
              >
                <Github className="h-4 w-4" />
                {t("github")}
              </a>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.3} direction="right">
          <div className="flex justify-center">
            <div className="mascot-float">
              <MascotImage
                pose="community"
                alt="Mascot arm around a friend"
                width={300}
                height={300}
              />
            </div>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

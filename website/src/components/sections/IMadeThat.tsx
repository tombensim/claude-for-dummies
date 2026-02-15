"use client";

import { useTranslations } from "next-intl";
import FadeIn from "@/components/ui/FadeIn";
import MascotImage from "@/components/ui/MascotImage";
import Section from "@/components/layout/Section";
import { Marquee } from "@/components/ui/marquee";

function TestimonialCard({
  quote,
  author,
}: {
  quote: string;
  author: string;
}) {
  return (
    <div className="mx-3 w-72 shrink-0 rounded-xl border border-border-warm bg-bg-elevated p-6 shadow-sm">
      <p className="text-sm leading-relaxed text-text-secondary">
        &ldquo;{quote}&rdquo;
      </p>
      <p className="mt-4 text-xs font-semibold text-dummy-yellow-muted">
        — {author}
      </p>
    </div>
  );
}

export default function IMadeThat() {
  const t = useTranslations("IMadeThat");

  const testimonials = [
    { quote: t("quote1"), author: t("author1") },
    { quote: t("quote2"), author: t("author2") },
    { quote: t("quote3"), author: t("author3") },
  ];

  return (
    <Section id="imade" surface>
      <FadeIn>
        <div className="mb-8 text-center">
          <h2 className="font-[family-name:var(--font-inter)] text-3xl font-bold text-text-primary sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-lg text-text-secondary">{t("subtitle")}</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="flex justify-center">
          <div className="mascot-float">
            <MascotImage
              pose="celebrating"
              alt="Mascot celebrating with confetti"
              width={120}
              height={120}
            />
          </div>
        </div>
      </FadeIn>

      <div className="mt-8">
        <Marquee pauseOnHover>
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} quote={t.quote} author={t.author} />
          ))}
          {/* Duplicate for seamless loop */}
          {testimonials.map((t, i) => (
            <TestimonialCard key={`dup-${i}`} quote={t.quote} author={t.author} />
          ))}
        </Marquee>
      </div>
    </Section>
  );
}

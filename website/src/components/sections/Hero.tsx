"use client";

import { useTranslations } from "next-intl";
import MascotImage from "@/components/ui/MascotImage";

export default function Hero() {
  const t = useTranslations("Hero");

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-dummy-yellow px-6 pt-16">
      {/* Book cover style layout */}
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        {/* Black banner - like the book cover top */}
        <div className="hero-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="w-full rounded-2xl bg-dummy-black px-8 py-10 sm:px-16 sm:py-14">
            <p className="font-hand text-4xl text-dummy-yellow sm:text-6xl md:text-7xl lg:text-8xl">
              {t("topic")}
            </p>
            {t("for") && (
              <p className="mt-2 text-lg font-bold uppercase tracking-[0.3em] text-dummy-white sm:text-xl">
                {t("for")}
              </p>
            )}
            <p className="font-[family-name:var(--font-display)] text-5xl text-dummy-white sm:text-7xl md:text-8xl lg:text-9xl">
              {t("dummies")}
            </p>
          </div>
        </div>

        {/* Subtitle */}
        <div className="hero-fade-up" style={{ animationDelay: "0.5s" }}>
          <p className="mt-8 max-w-xl text-xl font-medium leading-relaxed text-dummy-black sm:text-2xl">
            {t("subtitle")}
          </p>
        </div>

        {/* CTA */}
        <div className="hero-fade-up" style={{ animationDelay: "0.7s" }}>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <a
              href="#start"
              className="rounded-xl border-4 border-dummy-black bg-dummy-black px-10 py-4 font-[family-name:var(--font-display)] text-xl text-dummy-yellow transition-all hover:bg-transparent hover:text-dummy-black"
            >
              {t("cta")}
            </a>
            <a
              href="#magic"
              className="text-base font-bold text-dummy-black underline decoration-2 underline-offset-4 transition-opacity hover:opacity-70"
            >
              {t("ctaSecondary")}
            </a>
          </div>
        </div>
      </div>

      {/* Mascot - bottom right */}
      <div
        className="hero-slide-in absolute bottom-4 end-3 sm:bottom-8 sm:end-8 lg:bottom-10 lg:end-12"
        style={{ animationDelay: "0.4s" }}
      >
        <div className="rotate-2 rounded-2xl border-4 border-dummy-black bg-[#E6E6E6] p-1 shadow-[8px_8px_0_0_#1A1A1A] sm:p-2">
          <MascotImage
            pose="hero"
            alt="Friendly mascot character"
            width={128}
            height={128}
            className="h-[128px] w-[128px] sm:h-[180px] sm:w-[180px] lg:h-[200px] lg:w-[200px]"
            priority
          />
        </div>
      </div>

    </section>
  );
}

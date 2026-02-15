"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  MessageCircle,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import FadeIn from "@/components/ui/FadeIn";
import MascotImage from "@/components/ui/MascotImage";

export default function GettingStarted() {
  const t = useTranslations("GettingStarted");

  const benefits = [
    {
      icon: <CheckCircle2 className="h-7 w-7" />,
      title: t("benefit1title"),
      desc: t("benefit1desc"),
    },
    {
      icon: <Wrench className="h-7 w-7" />,
      title: t("benefit2title"),
      desc: t("benefit2desc"),
    },
    {
      icon: <ShieldCheck className="h-7 w-7" />,
      title: t("benefit3title"),
      desc: t("benefit3desc"),
    },
  ];

  const steps = [
    {
      icon: <MousePointerClick className="h-8 w-8" />,
      title: t("step1title"),
      desc: t("step1desc"),
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: t("step2title"),
      desc: t("step2desc"),
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: t("step3title"),
      desc: t("step3desc"),
    },
  ];

  return (
    <section id="start" className="bg-dummy-yellow px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <FadeIn>
          <h2 className="text-center font-[family-name:var(--font-display)] text-4xl text-dummy-black sm:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-center text-base font-medium leading-relaxed text-dummy-black/80 sm:text-lg">
            {t("subtitle")}
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <h3 className="mt-12 text-center font-[family-name:var(--font-display)] text-2xl text-dummy-black sm:text-3xl">
            {t("benefitsTitle")}
          </h3>
        </FadeIn>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {benefits.map((benefit, i) => (
            <FadeIn key={i} delay={0.15 * i}>
              <div className="h-full rounded-2xl border-4 border-dummy-black bg-dummy-white p-6 shadow-[6px_6px_0_0_#1A1A1A]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-dummy-black bg-dummy-yellow text-dummy-black">
                  {benefit.icon}
                </div>
                <h4 className="mt-4 font-[family-name:var(--font-display)] text-xl text-dummy-black">
                  {benefit.title}
                </h4>
                <p className="mt-2 text-sm font-medium leading-relaxed text-dummy-black/75">
                  {benefit.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.25}>
          <h3 className="mt-14 text-center font-[family-name:var(--font-display)] text-2xl text-dummy-black sm:text-3xl">
            {t("stepsTitle")}
          </h3>
        </FadeIn>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <FadeIn key={i} delay={0.15 * i}>
              <div className="flex h-full flex-col items-center rounded-2xl border-4 border-dummy-black bg-dummy-white p-8 text-center shadow-[6px_6px_0_0_#1A1A1A] transition-transform hover:-translate-y-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-dummy-black bg-dummy-yellow text-dummy-black">
                  {step.icon}
                </div>
                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-full bg-dummy-black font-[family-name:var(--font-display)] text-xl text-dummy-yellow">
                  {i + 1}
                </div>
                <h4 className="mt-4 font-[family-name:var(--font-display)] text-xl text-dummy-black">
                  {step.title}
                </h4>
                <p className="mt-2 text-sm font-medium text-dummy-black/70">
                  {step.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.5}>
          <div className="mt-14 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8">
            <div className="rotate-[-3deg] rounded-2xl border-4 border-dummy-black bg-[#E6E6E6] p-1 shadow-[8px_8px_0_0_#1A1A1A]">
              <MascotImage
                pose="peeking"
                alt="Mascot peeking from behind a laptop"
                width={112}
                height={112}
                className="h-28 w-28"
              />
            </div>
            <a
              href="#"
              className="rounded-xl border-4 border-dummy-black bg-dummy-black px-10 py-4 text-center font-[family-name:var(--font-display)] text-xl text-dummy-yellow transition-all hover:bg-transparent hover:text-dummy-black"
            >
              {t("cta")}
            </a>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

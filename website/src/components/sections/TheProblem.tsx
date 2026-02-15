"use client";

import { useTranslations } from "next-intl";
import FadeIn from "@/components/ui/FadeIn";
import Section from "@/components/layout/Section";

export default function TheProblem() {
  const t = useTranslations("TheProblem");
  const terminalLines = [
    "$ npm install --save-dev webpack babel-loader",
    "ERROR: Module not found: Can't resolve 'react-dom'",
    "$ git push origin main --force",
    "FATAL: Permission denied (publickey)",
    "$ docker-compose up --build",
    "Error response from daemon: port already in use",
  ];

  return (
    <Section id="problem">
      <div className="grid items-center gap-12 md:grid-cols-2">
        {/* The idea side */}
        <FadeIn>
          <div className="space-y-4">
            <h2 className="font-[family-name:var(--font-inter)] text-3xl font-bold text-text-primary sm:text-4xl">
              {t("title")}
            </h2>
            <p className="text-lg leading-relaxed text-text-secondary">
              {t("p1")}
            </p>
            <p className="text-lg leading-relaxed text-text-secondary">
              {t("p2")}
            </p>
            <p className="text-lg leading-relaxed text-text-secondary">
              {t("p3")}
            </p>
            <p className="mt-4 text-lg font-medium text-text-primary">
              {t("p4")}
            </p>
            <p className="text-base text-text-dim">{t("wall")}</p>
          </div>
        </FadeIn>

        {/* The wall side - terminal gibberish */}
        <FadeIn delay={0.3} direction="right">
          <div className="overflow-hidden rounded-xl border border-border-warm bg-dummy-black shadow-lg">
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-dummy-red" />
              <div className="h-3 w-3 rounded-full bg-dummy-yellow" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="ms-2 font-mono text-xs text-white/40">
                terminal
              </span>
            </div>
            {/* Terminal content */}
            <div className="p-4 font-mono text-sm leading-loose">
              {terminalLines.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith("ERROR") || line.startsWith("FATAL") || line.startsWith("Error")
                      ? "text-dummy-red"
                      : "text-green-400/80"
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Punchline */}
      <FadeIn delay={0.6}>
        <p className="mt-16 text-center font-[family-name:var(--font-inter)] text-4xl font-extrabold text-dummy-yellow sm:text-5xl">
          {t("punchline")}
        </p>
      </FadeIn>
    </Section>
  );
}

import { useTranslations } from "next-intl";
import MascotImage from "@/components/ui/MascotImage";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t-4 border-dummy-yellow bg-dummy-black px-6 py-12">
      <div className="mx-auto flex max-w-4xl flex-col-reverse items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-start">
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg text-dummy-yellow">
            {t.rich("tagline", {
              link: (chunks) => (
                <a
                  href="https://the-shift.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-dummy-white transition-colors"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
          <p className="text-xs text-dummy-white/40">
            &copy; 2026 {t("copyright")}
          </p>
        </div>
        <div className="rotate-2 rounded-xl border-2 border-dummy-yellow/70 bg-[#E6E6E6] p-1 shadow-[6px_6px_0_0_rgba(255,215,0,0.2)]">
          <MascotImage
            pose="waving"
            alt="Mascot waving goodbye"
            width={72}
            height={72}
            className="h-[72px] w-[72px]"
          />
        </div>
      </div>
    </footer>
  );
}

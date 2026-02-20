"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Copy, Share2, ArrowLeft, Plus } from "lucide-react";
import MascotImage from "@/components/brand/MascotImage";
import { Button } from "@/components/ui/button";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { useAppStore } from "@/lib/store";

export default function DonePage() {
  const t = useTranslations("Done");
  const router = useRouter();
  const liveUrl = useAppStore((s) => s.liveUrl);
  const projectName = useAppStore((s) => s.projectName);
  const reset = useAppStore((s) => s.reset);
  const confettiRef = useRef<ConfettiRef>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      confettiRef.current?.fire({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#1A1A1A", "#FFE94A", "#F5C800"],
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  function handleCopy() {
    if (liveUrl) {
      navigator.clipboard.writeText(liveUrl);
    }
  }

  function handleShare() {
    if (liveUrl && typeof navigator.share === "function") {
      navigator.share({
        title: projectName || "My Website",
        url: liveUrl,
      });
    }
  }

  function handleChange() {
    router.push("/build");
  }

  function handleNewBuild() {
    reset();
    router.push("/welcome");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-dummy-yellow p-8">
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-50 h-full w-full"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        className="mb-6"
      >
        <MascotImage
          pose="celebrating"
          alt="Celebrating"
          width={220}
          height={220}
          className="rotate-2"
          priority
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-6 max-w-lg text-center font-[family-name:var(--font-display)] text-3xl leading-tight text-dummy-black"
      >
        {t("congratulations")}
      </motion.h1>

      {liveUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-brand mb-6 w-full max-w-md p-6"
        >
          <p className="mb-3 text-center text-lg font-bold text-dummy-black break-all">
            {liveUrl}
          </p>

          <div className="flex gap-3">
            <Button
              variant="brand"
              size="lg"
              className="flex-1 gap-2"
              onClick={handleCopy}
            >
              <Copy className="size-4" />
              {t("copyUrl")}
            </Button>
            <Button
              variant="brand-outline"
              size="lg"
              className="flex-1 gap-2"
              onClick={handleShare}
            >
              <Share2 className="size-4" />
              {t("share")}
            </Button>
          </div>

          <p className="mt-3 text-center text-xs text-dummy-black/50">
            {t("worksOnPhones")}
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex gap-4"
      >
        <Button
          variant="brand-outline"
          size="lg"
          className="gap-2"
          onClick={handleChange}
        >
          <ArrowLeft className="size-4" />
          {t("changeSomething")}
        </Button>
        <Button
          variant="brand"
          size="lg"
          className="gap-2"
          onClick={handleNewBuild}
        >
          <Plus className="size-4" />
          {t("buildNew")}
        </Button>
      </motion.div>
    </div>
  );
}

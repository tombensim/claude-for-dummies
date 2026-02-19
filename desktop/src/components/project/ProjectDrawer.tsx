"use client";

import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import ProjectIdentityCard from "./ProjectIdentityCard";
import ProjectChoicesCard from "./ProjectChoicesCard";
import ProjectInspirations from "./ProjectInspirations";
import ProjectServices from "./ProjectServices";
import ProjectEnvVars from "./ProjectEnvVars";
import ProjectNotes from "./ProjectNotes";
import ProjectTimeline from "./ProjectTimeline";
import ProjectActivityLog from "./ProjectActivityLog";
import ProjectQuickActions from "./ProjectQuickActions";

export default function ProjectDrawer() {
  const t = useTranslations("ProjectPanel");
  const isOpen = useAppStore((s) => s.projectDrawerOpen);
  const locale = useAppStore((s) => s.locale);
  const close = useAppStore((s) => s.setProjectDrawerOpen);

  // In RTL (Hebrew), drawer slides from the right; in LTR from the left
  const isRtl = locale === "he";
  const slideFrom = isRtl ? "100%" : "-100%";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-dummy-black/30"
            onClick={() => close(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: slideFrom }}
            animate={{ x: 0 }}
            exit={{ x: slideFrom }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className={`fixed top-0 bottom-0 z-50 flex w-[380px] flex-col bg-dummy-white shadow-2xl ${
              isRtl ? "right-0" : "left-0"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-dummy-black/10 px-4 py-3">
              <h2 className="text-base text-dummy-black font-display">
                {t("title")}
              </h2>
              <button
                onClick={() => close(false)}
                className="rounded-md p-1 text-dummy-black/50 transition-colors hover:bg-dummy-black/5 hover:text-dummy-black"
                aria-label={t("close")}
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <ProjectIdentityCard />
              <div className="mx-4 border-t border-dummy-black/5" />
              <ProjectChoicesCard />
              <div className="mx-4 border-t border-dummy-black/5" />
              <ProjectInspirations />
              <div className="mx-4 border-t border-dummy-black/5" />
              <ProjectServices />
              <div className="mx-4 border-t border-dummy-black/5" />
              <ProjectEnvVars />
              <div className="mx-4 border-t border-dummy-black/5" />
              <ProjectNotes />
              <div className="mx-4 border-t border-dummy-black/5" />
              <ProjectTimeline />
              <div className="mx-4 border-t border-dummy-black/5" />
              <ProjectActivityLog />
            </div>

            {/* Quick actions pinned to bottom */}
            <ProjectQuickActions />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

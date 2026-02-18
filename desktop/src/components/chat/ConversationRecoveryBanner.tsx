"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History } from "lucide-react";
import { useTranslations } from "next-intl";

interface ConversationRecoveryBannerProps {
  show: boolean;
}

export default function ConversationRecoveryBanner({
  show,
}: ConversationRecoveryBannerProps) {
  const t = useTranslations("Chat");
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [show]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-dummy-black/5 px-4 py-2">
            <History className="size-3.5 text-dummy-black/50" />
            <span className="text-xs text-dummy-black/60">
              {t("conversationRestored")}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

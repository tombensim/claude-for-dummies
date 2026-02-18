"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Globe, HardDrive, Loader2, Rocket, Sparkles } from "lucide-react";
import MascotImage from "@/components/brand/MascotImage";
import { Button } from "@/components/ui/button";
import { useAppStore, type ProjectMeta } from "@/lib/store";

function relativeTime(
  dateStr: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return t("justNow");
  if (days === 1) return t("yesterday");
  return t("daysAgo", { count: days });
}

function ProjectStatusBadge({ project, t }: { project: ProjectMeta; t: (key: string) => string }) {
  if (project.liveUrl) {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
        <Globe className="size-3" />
        {t("statusLive")}
      </span>
    );
  }
  if (project.sessionId) {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
        <HardDrive className="size-3" />
        {t("statusLocal")}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-bold text-dummy-black/40">
      <Loader2 className="size-3" />
      {t("statusInProgress")}
    </span>
  );
}

export default function WelcomePage() {
  const t = useTranslations("Welcome");
  const tp = useTranslations("Project");
  const router = useRouter();
  const store = useAppStore();

  const [recentProjects, setRecentProjects] = useState<ProjectMeta[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const hasProjects = recentProjects.length > 0;

  // Load recent projects on mount
  useEffect(() => {
    window.electronAPI
      ?.listProjects?.()
      .then((projects: ProjectMeta[]) => {
        if (projects?.length) setRecentProjects(projects);
      })
      .catch(() => {});
  }, []);

  async function handleStartBuilding() {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const meta = await window.electronAPI?.createProject?.("", store.locale);
      if (meta) {
        store.setProjectDir(meta.path);
        store.setActiveProjectId(meta.id);
        store.setProjectName(meta.name);
      }
    } catch (err) {
      console.error("[welcome] Project creation failed:", err);
    }

    store.setWorkspaceMode(false);
    store.setStep(2, 0);
    router.push("/build");
  }

  async function handleProjectSwitch(project: ProjectMeta) {
    try {
      const meta = await window.electronAPI?.switchProject?.(project.id);
      if (!meta) return;
      store.loadProject(meta);
      if (meta.sessionId) {
        store.setStep(4, 1);
      }
      router.push("/build");
    } catch (err) {
      console.error("[welcome] Project switch failed:", err);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dummy-yellow p-8">
      {/* Mascot */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <MascotImage
          pose="waving"
          alt="Mascot"
          width={hasProjects ? 120 : 180}
          height={hasProjects ? 120 : 180}
          className="rotate-2"
        />
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg text-center"
      >
        {hasProjects ? (
          <>
            {/* Returning user: project hub */}
            <h1 className="mb-6 font-[family-name:var(--font-display)] text-2xl text-dummy-black">
              {t("hubGreeting")}
            </h1>

            {/* Project cards */}
            <div className="mb-6">
              <p className="mb-3 text-start text-xs font-bold uppercase tracking-wider text-dummy-black/50">
                {t("yourProjects")}
              </p>
              <div className="flex flex-col gap-2">
                {recentProjects.map((project, i) => (
                  <motion.button
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleProjectSwitch(project)}
                    className="flex items-center justify-between rounded-xl border-2 border-dummy-black/20 bg-dummy-white px-4 py-3 text-start transition-all hover:border-dummy-black hover:shadow-[4px_4px_0_0_#1A1A1A]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-dummy-black">
                        {project.displayName || project.name}
                      </p>
                      <p className="text-xs text-dummy-black/50">
                        {relativeTime(project.lastOpenedAt, tp)}
                      </p>
                    </div>
                    <ProjectStatusBadge project={project} t={t} />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Build something new — secondary */}
            <Button
              variant="brand-outline"
              size="lg"
              className="w-full"
              onClick={handleStartBuilding}
              disabled={isCreating}
            >
              <Sparkles className="size-4" />
              {t("buildSomethingNew")}
            </Button>
          </>
        ) : (
          <>
            {/* New user: original hero */}
            <h1 className="mb-2 font-[family-name:var(--font-display)] text-3xl text-dummy-black">
              {t("greeting")}
            </h1>
            <h2 className="mb-6 text-xl font-bold text-dummy-black">
              {t("whatToBuild")}
            </h2>

            <Button
              variant="brand"
              size="xl"
              className="w-full max-w-sm"
              onClick={handleStartBuilding}
              disabled={isCreating}
            >
              <Rocket className="size-5" />
              {t("startBuilding")}
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useAppStore, type ImageAttachment } from "@/lib/store";
import { connectToAgent, type AgentCallbacks } from "@/lib/agent-client";
import { getPhaseForStep } from "@/lib/progress-config";
import { createMilestoneThrottler } from "@/lib/milestone-extractor";
import { useChatPersistence } from "@/lib/use-chat-persistence";
import { useDebugStore } from "@/lib/debug-store";
import { useDebugShortcut } from "@/lib/use-debug-shortcut";
import ChatPanel from "@/components/chat/ChatPanel";
import LivePreview from "@/components/preview/LivePreview";
import DebugTerminal from "@/components/debug/DebugTerminal";
import ProjectDrawer from "@/components/project/ProjectDrawer";
import ProjectDrawerToggle from "@/components/project/ProjectDrawerToggle";
import WorkspaceHeader from "@/components/build/WorkspaceHeader";

import StepIndicator from "@/components/progress/StepIndicator";
import Logo from "@/components/brand/Logo";
import LanguageToggle from "@/components/brand/LanguageToggle";

function formatInitialMessage(locale: "he" | "en"): string {
  return locale === "he"
    ? "היי! אני מוכן להתחיל"
    : "Hey! I'm ready to start";
}

function formatWorkspaceContext(locale: "he" | "en"): string {
  return `[WORKSPACE MODE]
The user is returning to an existing project. Do NOT run the step system or progress.sh.
Read CLAUDE.md for project context. Start the dev server if not running.
Wait for the user's message — they will tell you what they need.
Locale: ${locale}`;
}

export default function BuildPage() {
  const t = useTranslations("Build");
  const router = useRouter();
  const store = useAppStore();
  const abortRef = useRef<{ abort: () => void } | null>(null);
  const hasStarted = useRef(false);
  const milestoneExtractor = useRef(createMilestoneThrottler(store.locale));
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isWorkspace = store.isWorkspaceMode;

  useDebugShortcut();

  // Persistence
  const { isLoaded } = useChatPersistence(store.projectDir);

  // Recover projectDir from electron-store if missing
  useEffect(() => {
    if (!store.projectDir) {
      window.electronAPI?.getActiveProject?.().then((meta: { path?: string; id?: string; name?: string } | null) => {
        if (meta?.path) {
          store.setProjectDir(meta.path);
          if (meta.id) store.setActiveProjectId(meta.id);
          if (meta.name) store.setProjectName(meta.name);
        }
      }).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load milestones when project dir is available
  useEffect(() => {
    if (!store.projectDir) return;
    window.electronAPI?.loadMilestones?.(store.projectDir).then((milestones: unknown[]) => {
      if (milestones?.length) {
        store.loadMilestones(milestones as Parameters<typeof store.loadMilestones>[0]);
      }
    }).catch(() => {});
  }, [store.projectDir]); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch for pending chat messages from other components (e.g. project drawer)
  useEffect(() => {
    const msg = store.pendingChatMessage;
    if (msg) {
      store.setPendingChatMessage(null);
      sendToAgent(msg);
    }
  }, [store.pendingChatMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start agentic flow once persistence has loaded
  useEffect(() => {
    if (hasStarted.current) return;
    if (!isLoaded) return;
    if (!store.projectDir) return;
    hasStarted.current = true;

    // If we have restored messages, show recovery banner and skip initial prompt
    if (store.messages.length > 0) {
      setShowRecoveryBanner(true);
      // In workspace mode, also try to start the dev server preview
      if (isWorkspace) {
        window.electronAPI?.pollPort?.(3000).then((ready: boolean) => {
          if (ready) store.setPreviewUrl("http://localhost:3000");
        });
      }
      return;
    }

    // If resuming a session, don't re-send the initial prompt
    if (store.sessionId) {
      // In workspace mode, try to detect running dev server
      if (isWorkspace) {
        window.electronAPI?.pollPort?.(3000).then((ready: boolean) => {
          if (ready) store.setPreviewUrl("http://localhost:3000");
        });
      }
      return;
    }

    // Workspace mode: send context message, then wait for user
    if (isWorkspace) {
      sendToAgent(formatWorkspaceContext(store.locale));
      return;
    }

    // Wizard mode: send initial greeting
    sendToAgent(formatInitialMessage(store.locale));
  }, [isLoaded, store.projectDir]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendToAgent = useCallback(
    (prompt: string, images?: ImageAttachment[]) => {
      // Add user message to chat
      store.addMessage({
        id: `user-${Date.now()}`,
        role: "user",
        content: prompt,
        timestamp: Date.now(),
        images,
      });

      // Hide suggestion chips after first user message
      if (isWorkspace && store.chipsVisible) {
        store.hideChips();
      }

      store.setStreaming(true);

      abortRef.current = connectToAgent({
        prompt,
        images,
        locale: store.locale,
        projectDir: store.projectDir || undefined,
        sessionId: store.sessionId || undefined,
        onMessage: (msg) => {
          store.addMessage(msg);
          // Extract milestones for the project activity log
          const milestone = milestoneExtractor.current(msg);
          if (milestone) {
            store.addMilestone(milestone);
            // Persist milestones
            if (store.projectDir) {
              const allMilestones = [...useAppStore.getState().milestones];
              window.electronAPI?.saveMilestones?.(store.projectDir, allMilestones).catch(() => {});
            }
          }
        },
        onSessionId: (sessionId) => {
          store.setSessionId(sessionId);
          // Persist to electron-store
          const projectId = store.activeProjectId;
          if (projectId) {
            window.electronAPI?.updateProject?.(projectId, { sessionId }).catch(() => {});
          }
        },
        onDone: () => {
          store.setStreaming(false);
        },
        onRawEvent: (raw, timestamp) => {
          useDebugStore.getState().addEvent(raw, timestamp);
        },
        onError: (err) => {
          store.setStreaming(false);
          store.addMessage({
            id: `error-${Date.now()}`,
            role: "status",
            content:
              store.locale === "he"
                ? "אופס. שנייה..."
                : "Whoops. Give me a sec...",
            timestamp: Date.now(),
          });
        },
        callbacks: {
          onDevServerDetected: () => {
            // Poll port 3000 and set preview URL when ready
            window.electronAPI?.pollPort?.(3000).then((ready: boolean) => {
              if (ready) {
                store.setPreviewUrl("http://localhost:3000");
              }
            });
          },
          onFileChanged: () => {
            setRefreshTrigger((c) => c + 1);
          },
          onStepCompleted: (step) => {
            store.completeStep(step);
            store.setStep(step + 1, getPhaseForStep(step + 1));
          },
          onLiveUrl: (url) => {
            store.setLiveUrl(url);
            const projectId = store.activeProjectId;
            if (projectId) {
              window.electronAPI?.updateProject?.(projectId, { liveUrl: url }).catch(() => {});
            }
          },
        } satisfies AgentCallbacks,
      });
    },
    [store, isWorkspace]
  );

  function handleSend(message: string, images?: ImageAttachment[]) {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    sendToAgent(message, images);
  }

  function handleDeploy() {
    const deployPrompt = store.locale === "he"
      ? "תעלה את השינויים האחרונים שלי לאינטרנט"
      : "Deploy my latest changes to production";
    handleSend(deployPrompt);
  }

  function handleBack() {
    if (store.isStreaming) {
      store.setProjectDrawerOpen(true);
    } else {
      store.reset();
      router.push("/welcome");
    }
  }

  return (
    <div className="flex h-screen flex-col bg-dummy-yellow">
      {/* Header */}
      <header className="drag-region flex items-center justify-between border-b-2 border-dummy-black/10 bg-dummy-yellow px-4 py-2" style={{ paddingLeft: 80 }}>
        <div className="no-drag flex items-center gap-2">
          <ProjectDrawerToggle />
          {!isWorkspace && <Logo />}
        </div>

        {isWorkspace ? (
          <div className="no-drag flex-1">
            <WorkspaceHeader onBack={handleBack} onDeploy={handleDeploy} />
          </div>
        ) : (
          <div className="no-drag flex-1" />
        )}

        <div className="no-drag flex items-center gap-2">
          {!isWorkspace && (
            <button
              onClick={handleBack}
              className="rounded-md border-2 border-dummy-black/20 bg-dummy-white p-1.5 text-dummy-black/60 transition-colors hover:border-dummy-black hover:bg-dummy-black hover:text-dummy-yellow"
              aria-label="New project"
            >
              <Plus className="size-4" />
            </button>
          )}
          <LanguageToggle />
        </div>
      </header>

      {/* Main content: chat + optional preview */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className={`flex flex-col overflow-hidden bg-dummy-yellow-bright/30 ${store.previewUrl ? "w-1/2" : "w-full"}`}>
          <ChatPanel
            onSend={handleSend}
            showRecoveryBanner={showRecoveryBanner}
            isWorkspaceMode={isWorkspace}
          />
        </div>

        {/* Live preview (shown when dev server is running) */}
        {store.previewUrl && (
          <div className="w-1/2 border-s-2 border-dummy-black/10">
            <LivePreview refreshTrigger={refreshTrigger} />
          </div>
        )}
      </div>

      {/* Feedback banner — only in wizard mode */}
      {!isWorkspace && store.completedSteps.includes(4) && !store.isStreaming && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t-2 border-dummy-black/10 bg-dummy-white px-4 py-3 text-center"
        >
          <p className="text-sm font-medium text-dummy-black">
            {t("feedbackBanner")}
          </p>
        </motion.div>
      )}

      <DebugTerminal />
      <ProjectDrawer />
    </div>
  );
}

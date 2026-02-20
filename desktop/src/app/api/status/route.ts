import { NextResponse } from "next/server";
import { appLog, LOG_DIR } from "@/lib/logger";

/**
 * Status endpoint for checking project state and progress.
 * Claude auth is now handled by the SDK (always available as npm dep).
 */
export async function GET() {
  appLog.debug("Status check");
  return NextResponse.json({
    runtimeReady: true,
    claudeAuthenticated: true, // SDK is bundled, no CLI lookup needed
    projectDir: null,
    currentStep: 1,
    phase: 0,
    logDir: LOG_DIR,
  });
}

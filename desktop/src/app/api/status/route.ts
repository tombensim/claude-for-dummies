import { NextResponse } from "next/server";
import { appLog, LOG_DIR } from "@/lib/logger";

/**
 * Status endpoint for checking project state and progress.
 */
export async function GET() {
  appLog.debug("Status check");
  return NextResponse.json({
    runtimeReady: true,
    claudeAuthenticated: false,
    projectDir: null,
    currentStep: 1,
    phase: 0,
    logDir: LOG_DIR,
  });
}

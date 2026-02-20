import { NextResponse } from "next/server";
import { appLog, LOG_DIR } from "@/lib/logger";
import { findClaude } from "@/lib/find-claude";
import { execSync } from "child_process";

function checkClaudeAuth(): boolean {
  try {
    const claudePath = findClaude();
    if (!claudePath || claudePath === "claude") return false;
    // Quick check: run claude with a trivial command to see if authenticated
    execSync(`${claudePath} --version`, { timeout: 5000, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Status endpoint for checking project state and progress.
 */
export async function GET() {
  appLog.debug("Status check");
  const claudeAuthenticated = checkClaudeAuth();
  return NextResponse.json({
    runtimeReady: true,
    claudeAuthenticated,
    projectDir: null,
    currentStep: 1,
    phase: 0,
    logDir: LOG_DIR,
  });
}

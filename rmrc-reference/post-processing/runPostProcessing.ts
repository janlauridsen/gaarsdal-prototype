import { PostProcessingLogger } from "../logs/postProcessingLogger";
import { LogEvent } from "../logs/logger";

/**
 * Entry point for post-session evaluation.
 * Called manually or by scripts — never by runtime.
 */
export function runPostProcessing(
  sessionId: string,
  runtimeLogs: LogEvent[]
) {
  const logger = new PostProcessingLogger();

  // Example: very first evaluation hook
  logger.log({
    type: "session_evaluated",
    timestamp: Date.now(),
    sessionId,
    data: {
      turnCount: runtimeLogs.filter(
        (e) => e.type === "turn_started"
      ).length,
      roleInvocations: runtimeLogs.filter(
        (e) => e.type === "role_invoked"
      ).length,
    },
  });

  return logger.getEvents();
}

// guided-chat/logging/logWriter.ts

import { KernelLogEvent } from "./log.types";

/**
 * Passive log writer.
 * No return value.
 * No influence on control flow.
 */
export async function writeKernelLog(
  event: KernelLogEvent
): Promise<void> {
  // Placeholder implementation.
  // Later: Redis, DB, file, stream.
  console.log("[KERNEL_LOG]", JSON.stringify(event));
}

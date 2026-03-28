import { JobKind, JobRecordV1 } from "./types"
import { tickScanThreads } from "./handlers/scanThreads"
import { tickDeriveThreadTitle } from "./handlers/deriveThreadTitle"
import { tickAnticipate } from "./handlers/anticipateTurn"

export type JobTickResult = {
  job: JobRecordV1
  completed: boolean
}

export async function tickJob(job: JobRecordV1): Promise<JobTickResult> {
  switch (job.kind as JobKind) {
    case "scan_threads":
      return tickScanThreads(job)
    case "derive_thread_title":
      return tickDeriveThreadTitle(job)
    case "anticipate_turn":
      return tickAnticipate(job)
    default:
      return {
        job: {
          ...job,
          status: "failed",
          last_error: `unknown job kind: ${String((job as any).kind)}`,
          updated_at: Date.now(),
        },
        completed: true,
      }
  }
}

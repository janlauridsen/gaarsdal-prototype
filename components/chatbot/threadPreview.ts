import type { ThreadTab } from "./types"

export function formatThreadPreview(t: ThreadTab): string {
  return (t.preview || "").trim()
}

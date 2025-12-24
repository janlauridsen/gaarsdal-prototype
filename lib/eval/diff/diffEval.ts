import type { BatchEvalResult, SessionEval } from "../types";

export type PromptDiffResult = {
  perSession: {
    sessionId: string;
    base?: SessionEval;
    next?: SessionEval;
  }[];

  summary: {
    added: number;
    removed: number;
    changed: number;
  };
};

export function diffEval(
  base: BatchEvalResult,
  next: BatchEvalResult
): PromptDiffResult {
  const byId = new Map<string, SessionEval>();

  // indexér base via replay.sessionId
  for (const s of base.sessions) {
    byId.set(s.replay.sessionId, s);
  }

  const perSession: PromptDiffResult["perSession"] = [];

  let added = 0;
  let removed = 0;
  let changed = 0;

  // gennemløb next
  for (const n of next.sessions) {
    const id = n.replay.sessionId;
    const b = byId.get(id);

    if (!b) {
      added++;
      perSession.push({ sessionId: id, next: n });
    } else {
      // placeholder: vi sammenligner struktur senere
      changed++;
      perSession.push({ sessionId: id, base: b, next: n });
      byId.delete(id);
    }
  }

  // resterende i base er fjernede
  for (const [id, b] of byId.entries()) {
    removed++;
    perSession.push({ sessionId: id, base: b });
  }

  return {
    perSession,
    summary: { added, removed, changed },
  };
}

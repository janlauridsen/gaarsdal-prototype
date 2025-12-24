import type { EvalContext } from "../types";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zæøå0-9\s]/gi, "")
    .split(/\s+/)
    .filter(Boolean);
}

export function redundancyScore(
  prev: string,
  next: string
): number {
  const prevWords = tokenize(prev);
  const nextWords = tokenize(next);

  if (prevWords.length === 0) return 0;

  const seen: { [key: string]: true } = {};
  for (let i = 0; i < prevWords.length; i++) {
    seen[prevWords[i]] = true;
  }

  let overlap = 0;
  for (let i = 0; i < nextWords.length; i++) {
    if (seen[nextWords[i]]) overlap++;
  }

  return overlap / prevWords.length;
}

export function evalRedundancy(ctx: EvalContext) {
  const turns = ctx.replay.turns;
  const issues = [];

  for (let i = 1; i < turns.length; i++) {
    const score = redundancyScore(
      turns[i - 1].assistantText,
      turns[i].assistantText
    );

    if (score > 0.7) {
      issues.push({
        code: "redundant_response",
        level: "warning",
        message: "Assistant gentager i høj grad tidligere svar.",
        turnIndex: i,
      });
    }
  }

  return issues;
}

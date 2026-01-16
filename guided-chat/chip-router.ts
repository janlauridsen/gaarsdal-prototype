// guided-chat/chip-router.ts

import { Chip } from "./chips";

export type ChipRouteResult = {
  chip: Chip | null;
  reason: string;
};

/**
 * Deterministisk router.
 * Ingen AI.
 * Matcher tydelige intentioner til ét chip.
 */
export function routeTextToChip(
  text: string,
  allowedChips: Chip[]
): ChipRouteResult {
  const t = text.toLowerCase();

  const rules: Array<{
    chip: Chip;
    match: (t: string) => boolean;
  }> = [
    {
      chip: "CONTACT",
      match: (t) =>
        t.includes("kontakt") ||
        t.includes("telefon") ||
        t.includes("ring") ||
        t.includes("email") ||
        t.includes("mail"),
    },
    {
      chip: "FACTS_HYPNO",
      match: (t) =>
        t.includes("hvad er hypno") ||
        t.includes("hvad er hypnoterapi") ||
        t.includes("hvordan virker") ||
        t.includes("fakta"),
    },
    {
      chip: "TRIAGE_RELEVANCE",
      match: (t) =>
        t.includes("kan hypno hjælpe") ||
        t.includes("er hypno relevant") ||
        t.includes("relevant for mig") ||
        t.includes("hjælpe mig"),
    },
    {
      chip: "BACK_TO_ROOT",
      match: (t) =>
        t.includes("tilbage") ||
        t.includes("menu") ||
        t.includes("start forfra"),
    },
  ];

  for (const rule of rules) {
    if (allowedChips.includes(rule.chip) && rule.match(t)) {
      return {
        chip: rule.chip,
        reason: "matched_by_rule",
      };
    }
  }

  return {
    chip: null,
    reason: "no_match",
  };
}

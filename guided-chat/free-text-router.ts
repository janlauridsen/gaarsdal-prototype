import { Chip } from "./chips";
import { NodeId } from "./node-router";
import { NODES } from "./nodes";

type Rule = {
  keywords: string[];
  chip: Chip;
};

const RULES: Rule[] = [
  {
    chip: "CONTACT",
    keywords: ["kontakt", "book", "tid", "ring", "mail"],
  },
  {
    chip: "FACTS_HYPNO",
    keywords: ["hvad er hypnose", "hypnoterapi", "fakta", "hvordan virker"],
  },
  {
    chip: "TRIAGE_RELEVANCE",
    keywords: ["kan det hjælpe", "er det relevant", "for mig", "virker det"],
  },
  {
    chip: "BACK_TO_ROOT",
    keywords: ["tilbage", "menu", "start", "forside"],
  },
];

export function mapFreeTextToChip(
  text: string,
  currentNode: NodeId
): Chip | null {
  const normalized = text.toLowerCase();

  const allowedChips = NODES[currentNode]?.chips ?? [];

  for (const rule of RULES) {
    if (!allowedChips.includes(rule.chip)) continue;

    for (const kw of rule.keywords) {
      if (normalized.includes(kw)) {
        return rule.chip;
      }
    }
  }

  return null;
}

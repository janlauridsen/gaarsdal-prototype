// chatbot/postanalysis/postanalysis.ts

import fs from "fs";
import path from "path";
import { Chip } from "../flow/chips";

/* =====================
   TYPES
   ===================== */

export type PostAnalysisEntry = {
  session_id: string;
  turn_id: number;
  chip: Chip;

  analysis: {
    intent_guess?: string;
    scope_match: boolean;
    ambiguity_level: "low" | "medium" | "high";
    safety_notes?: string[];
  };

  hypotheses: string[];
  flags: {
    medical_risk: boolean;
    off_scope: boolean;
  };

  meta: {
    model_version: "v10.0";
    analysis_version: "v1";
  };
};

/* =====================
   FILE TARGET
   ===================== */

const LOG_PATH = path.join(
  process.cwd(),
  "chatbot/postanalysis/postanalysis.log.jsonl"
);

/* =====================
   PUBLIC API
   ===================== */

export async function runPostAnalysis(input: {
  session_id: string;
  turn_id: number;
  chip: Chip;
  user_input: string;
  answer: string;
}) {
  const entry: PostAnalysisEntry = {
    session_id: input.session_id,
    turn_id: input.turn_id,
    chip: input.chip,

    analysis: {
      intent_guess: guessIntent(input.user_input),
      scope_match: isInScope(input.chip),
      ambiguity_level: estimateAmbiguity(input.user_input),
    },

    hypotheses: buildHypotheses(input.user_input),

    flags: {
      medical_risk: detectMedicalRisk(input.user_input),
      off_scope: !isInScope(input.chip),
    },

    meta: {
      model_version: "v10.0",
      analysis_version: "v1",
    },
  };

  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + "\n", "utf8");
}

/* =====================
   INTERNAL HELPERS
   ===================== */

function guessIntent(text: string): string | undefined {
  const t = text.toLowerCase();
  if (t.includes("søvn")) return "sleep-related";
  if (t.includes("mave")) return "gut-related";
  if (t.includes("stress")) return "stress-related";
  return undefined;
}

function estimateAmbiguity(text: string): "low" | "medium" | "high" {
  if (text.length < 20) return "high";
  if (text.length < 80) return "medium";
  return "low";
}

function isInScope(chip: Chip): boolean {
  return chip === "CONTACT" ||
    chip === "FACTS_HYPNO" ||
    chip === "TRIAGE_RELEVANCE";
}

function detectMedicalRisk(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("kræft") ||
    t.includes("blod") ||
    t.includes("svær smerte") ||
    t.includes("akut")
  );
}

function buildHypotheses(text: string): string[] {
  const h: string[] = [];
  const t = text.toLowerCase();

  if (t.includes("søvn")) h.push("søvn-relateret");
  if (t.includes("stress")) h.push("stress-relateret");
  if (t.includes("mave")) h.push("mave-tarm");

  return h;
}


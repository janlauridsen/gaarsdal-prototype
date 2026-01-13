// guided-chat/postanalysis/postanalysis.ts

import fs from "fs";
import path from "path";
import { Chip } from "../chips";

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
   WRITER
===================== */

const POSTANALYSIS_DIR = path.join(
  process.cwd(),
  "logs",
  "postanalysis"
);

export function writePostAnalysis(entry: PostAnalysisEntry) {
  if (!fs.existsSync(POSTANALYSIS_DIR)) {
    fs.mkdirSync(POSTANALYSIS_DIR, { recursive: true });
  }

  const file = path.join(
    POSTANALYSIS_DIR,
    `${entry.session_id}.jsonl`
  );

  fs.appendFileSync(file, JSON.stringify(entry) + "\n");
}

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// ===== Paths =====

const PROMPT_ROOT = path.join(process.cwd(), "chatbot/prompts/v10");

// ===== Chips =====

type V10Chip =
  | "CONTACT"
  | "FACTS_HYPNO"
  | "TRIAGE_RELEVANCE"
  | "BACK_TO_ROOT"
  | "INVALID_INPUT";

// ===== Prompt map =====

const V10_PROMPTS: Record<V10Chip, string> = {
  CONTACT: "contact.prompt.md",
  FACTS_HYPNO: "facts-hypno.prompt.md",
  TRIAGE_RELEVANCE: "triage-relevance.prompt.md",
  BACK_TO_ROOT: "root.prompt.md",
  INVALID_INPUT: "invalid-input.prompt.md",
};

// ===== Utils =====

function loadPrompt(file: string): string {
  return fs.readFileSync(path.join(PROMPT_ROOT, file), "utf-8");
}

function extractChip(body: any): V10Chip {
  const chip = body?.chip;
  if (!chip) return "INVALID_INPUT";
  if (chip in V10_PROMPTS) return chip;
  return "INVALID_INPUT";
}

// ===== Mock OpenAI call (erstat med din eksisterende) =====

async function callOpenAI(args: {
  call_id: string;
  session_id: string;
  turn_id: number;
  messages: { role: "system"; content: string }[];
}) {
  // Brug din eksisterende OpenAI-wrapper her
  return {
    content: "PLACEHOLDER_AI_RESPONSE",
    latency_ms: 0,
  };
}

// ===== Logging =====

function logTurn(entry: Record<string, any>) {
  console.log(JSON.stringify(entry));
}

function logPostAnalysis(entry: Record<string, any>) {
  console.log(JSON.stringify({ post_analysis: entry }));
}

// ===== Handler =====

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startedAt = Date.now();

  const session_id =
    (req.body?.session_id as string) || uuidv4();
  const turn_id =
    typeof req.body?.turn_id === "number"
      ? req.body.turn_id
      : 1;

  const raw_input = req.body ?? {};
  const chip = extractChip(req.body);

  const promptFile =
    chip === "INVALID_INPUT"
      ? V10_PROMPTS.INVALID_INPUT
      : V10_PROMPTS[chip];

  const systemPrompt = loadPrompt(promptFile);

  const ai = await callOpenAI({
    call_id: "v10_main",
    session_id,
    turn_id,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
    ],
  });

  const latency_ms = Date.now() - startedAt;

  // ===== Primary log =====

  logTurn({
    timestamp: new Date().toISOString(),
    session_id,
    turn_id,
    chip,
    prompt: promptFile,
    raw_input,
    ai_output: ai.content,
    latency_ms,
    version: "v10.0",
  });

  // ===== Response =====

  res.status(200).json({
    session_id,
    turn_id: turn_id + 1,
    chip,
    answer: ai.content,
  });

  // ===== Postanalysis (async, non-blocking) =====

  (async () => {
    logPostAnalysis({
      session_id,
      turn_id,
      chip,
      raw_input,
      ai_output: ai.content,
      hypotheses: [],
      notes: "internal only",
    });
  })();
}

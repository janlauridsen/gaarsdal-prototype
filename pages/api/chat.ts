// pages/api/chat.ts

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import { Chip } from "../../chatbot/flow/chips";
import { writeTurnLog } from "../../chatbot/logWriter";
import { TurnLog } from "../../chatbot/log.types";
import { runPostAnalysis } from "../../chatbot/postanalysis/postanalysis";

/* =====================
   CONFIG
   ===================== */
const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0.2;

/* =====================
   PROMPT PATHS
   ===================== */
const PROMPTS: Record<Chip | "INVALID", string> = {
  CONTACT: "contact.prompt.md",
  FACTS_HYPNO: "facts-hypno.prompt.md",
  TRIAGE_RELEVANCE: "triage-relevance.prompt.md",
  BACK_TO_ROOT: "root.prompt.md",
  INVALID: "invalid-input.prompt.md",
};

function loadPrompt(file: string): string {
  return fs.readFileSync(
    path.join(process.cwd(), "chatbot/prompts", file),
    "utf8"
  );
}

/* =====================
   CHIP DETECTION
   ===================== */
function detectChip(input: string): Chip | null {
  const t = input.toLowerCase();

  if (t.includes("kontakt")) return "CONTACT";
  if (t.includes("fakta") || t.includes("hvad er hypnose"))
    return "FACTS_HYPNO";
  if (
    t.includes("kan hypno") ||
    t.includes("relevant") ||
    t.includes("hjælpe")
  )
    return "TRIAGE_RELEVANCE";
  if (t.includes("tilbage") || t.includes("start"))
    return "BACK_TO_ROOT";

  return null;
}

/* =====================
   OPENAI CALL
   ===================== */
async function callOpenAI(prompt: string, userInput: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: TEMPERATURE,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: userInput },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI error ${res.status}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

/* =====================
   API HANDLER
   ===================== */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const startedAt = Date.now();
  const session_id =
    req.body?.session_id ??
    crypto.randomUUID();

  const user_input: string =
    typeof req.body?.input === "string"
      ? req.body.input.trim()
      : "";

  const turn_id = Date.now();

  let chip: Chip | "INVALID" =
    detectChip(user_input) ?? "INVALID";

  const promptFile = PROMPTS[chip];
  const prompt = loadPrompt(promptFile);

  let answer = "";

  try {
    answer = await callOpenAI(prompt, user_input);
  } catch (err: any) {
    answer = "Der opstod en teknisk fejl. Prøv igen senere.";
  }

  /* =====================
     LOGGING (SYNC)
     ===================== */
  const logEntry: TurnLog = {
    timestamp: new Date().toISOString(),
    session_id,
    turn_id,
    user_input,
    jan_raw_output: answer,
    jan_final_output: answer,
    evaluator_present: false,
    telemetry: {
      chip,
      model: MODEL,
    },
    latency_ms: Date.now() - startedAt,
    status: "ok",
  };

  await writeTurnLog(logEntry);

  /* =====================
     POST-ANALYSIS (ASYNC)
     ===================== */
  (async () => {
    try {
      await runPostAnalysis({
        session_id,
        turn_id,
        chip: chip === "INVALID" ? "BACK_TO_ROOT" : chip,
        user_input,
        answer,
      });
    } catch {
      /* silent */
    }
  })();

  return res.status(200).json({
    session_id,
    chip,
    answer,
  });
}

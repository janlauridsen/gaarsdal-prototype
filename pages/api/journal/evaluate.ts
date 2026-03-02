import type { NextApiRequest, NextApiResponse } from "next"

import { createOpenAiCompatibleClient } from "../../../chat/ai/provider"

type JournalProfile = "alcohol" | "general" | "strict"

type DraftPayload = {
  profile: JournalProfile
  draft: {
    text?: string
    ts_ms?: number
    fields?: Record<string, any>
  }
}

function isRecord(x: any): x is Record<string, any> {
  return !!x && typeof x === "object" && !Array.isArray(x)
}

function clampQuestions(xs: any): string[] {
  if (!Array.isArray(xs)) return []
  return xs
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .slice(0, 6)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: { message: "Method not allowed" } })

  const body = req.body
  if (!isRecord(body)) return res.status(400).json({ error: { message: "Invalid body" } })

  const profile = String(body.profile || "") as JournalProfile
  if (profile !== "alcohol" && profile !== "general" && profile !== "strict") {
    return res.status(400).json({ error: { message: "Invalid profile" } })
  }

  const draft = isRecord(body.draft) ? (body.draft as any) : null
  if (!draft) return res.status(400).json({ error: { message: "Missing draft" } })

  const text = typeof draft.text === "string" ? draft.text.trim() : ""
  const fields = isRecord(draft.fields) ? draft.fields : {}

  // Keep this endpoint purely “coaching” (lightweight):
  // - check for obvious omissions
  // - propose 2–6 short follow-up prompts
  // - never diagnose, never judge
  const system =
    "Du er en kortfattet coach for en dagbog. Din opgave er at hjælpe brugeren med at skrive et lidt bedre notat ved at foreslå opfølgende refleksionsspørgsmål. Undgå diagnose, behandling, moral og lange svar."

  const user = {
    profile,
    draft: {
      text,
      fields,
    },
    instruction:
      "Returnér KUN JSON med felterne: summary (string, max 2 sætninger), questions (array af 2-6 korte spørgsmål). Spørgsmål skal være konkrete og lette at besvare. Hvis intet oplagt: questions = [].",
  }

  const client = createOpenAiCompatibleClient()
  const model = process.env.OPENAI_MODEL_JSON || process.env.OPENAI_MODEL || "gpt-4o-mini"

  const parsed = await client.chatJson({
    model,
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(user) },
    ],
  })

  const summary = typeof parsed?.summary === "string" ? String(parsed.summary).trim().slice(0, 320) : ""
  const questions = clampQuestions((parsed as any)?.questions)

  return res.status(200).json({ summary, questions })
}

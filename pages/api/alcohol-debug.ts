import type { NextApiRequest, NextApiResponse } from "next"
import { getNode } from "../../chat/nodes/registry"
import { buildSystemPrompt } from "../../chat/ai/orchestration/singleTurnCall"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.query.token
  if (token !== process.env.ADMIN_TOKEN) return res.status(403).end()

  const out: any = {}

  // 1. Node check
  try {
    const node = getNode("HOME_ALCOHOL")
    out.home_alcohol = { capability_id: node.capability_id }
  } catch (e) { out.home_alcohol = { error: String(e) } }

  // 2. Test buildSystemPrompt MED alcohol-flag
  try {
    const promptAlcohol = buildSystemPrompt({
      assistantCount: 0,
      arousalLevel: "low",
      policySignals: { is_practical_request: false, is_closing: false, is_alcohol_context: true },
    } as any)
    out.with_alcohol_flag = {
      has_alcohol_block: promptAlcohol.includes("KONTEKST — ALKOHOL"),
      has_alcohol_role: promptAlcohol.includes("TØR dele faglig substans"),
      has_children_restriction: promptAlcohol.includes("Forbliv i undersøgende modus"),
      first_300: promptAlcohol.slice(0, 300),
    }
  } catch (e) { out.with_alcohol_flag = { error: String(e) } }

  // 3. Test UDEN flag (standard)
  try {
    const promptStd = buildSystemPrompt({
      assistantCount: 0,
      arousalLevel: "low",
      policySignals: { is_practical_request: false, is_closing: false },
    } as any)
    out.without_flag = {
      has_alcohol_block: promptStd.includes("KONTEKST — ALKOHOL"),
      has_children_restriction: promptStd.includes("Forbliv i undersøgende modus"),
    }
  } catch (e) { out.without_flag = { error: String(e) } }

  res.setHeader("Cache-Control", "no-store")
  return res.status(200).json(out)
}

import type { NextApiRequest, NextApiResponse } from "next"
import { getNode } from "../../chat/nodes/registry"
import { runCapability } from "../../chat/ai/runtime"
import { createLobbyState } from "../../chat/kernel/state"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.query.token
  if (token !== process.env.ADMIN_TOKEN) return res.status(403).end()

  const out: any = {}

  // 1. Findes HOME_ALCOHOL noden? Hvad er dens capability?
  try {
    const node = getNode("HOME_ALCOHOL")
    out.home_alcohol = { exists: true, capability_id: node.capability_id, kind: node.kind, message: node.message?.slice(0, 60) }
  } catch (e) { out.home_alcohol = { exists: false, error: String(e) } }

  // 2. Kør gen-alcohol-v1 capability direkte med en testbesked
  try {
    const state = createLobbyState("debug:alcohol")
    state.active_node = "HOME_ALCOHOL"
    const result = await runCapability("gen-alcohol-v1", {
      state,
      userText: "Jeg drikker et par glas vin hver aften, men det er ikke noget problem",
      contextPack: { system: "", user_profile: "", goal_hypothesis: null },
    } as any)
    out.capability_run = {
      ok: true,
      response: result.transition?.response_message?.slice(0, 300),
      to: result.transition?.to,
      debug: result.debug,
    }
  } catch (e) { out.capability_run = { ok: false, error: String(e) } }

  res.setHeader("Cache-Control", "no-store")
  return res.status(200).json(out)
}

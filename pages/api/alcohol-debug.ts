import type { NextApiRequest, NextApiResponse } from "next"
import { runCapability } from "../../chat/ai/runtime"
import { createLobbyState } from "../../chat/kernel/state"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.query.token
  if (token !== process.env.ADMIN_TOKEN) return res.status(403).end()

  const out: any = {}

  // Kør gen-alcohol-v1 capability direkte - skal nu give substans-svar
  try {
    const state = createLobbyState("debug:alcohol")
    state.active_node = "HOME_ALCOHOL"
    const result = await runCapability("gen-alcohol-v1", {
      state,
      userText: "Jeg drikker et par glas vin hver aften, men det er ikke noget problem",
      contextPack: { system: "", user_profile: "", goal_hypothesis: null },
    } as any)
    const resp = result.transition?.response_message ?? ""
    out.capability_run = {
      response: resp,
      // Substans-markører: nævner den søvn, selvmedicinering, eller konkret evidens?
      mentions_sleep: /søvn|sove|REM/i.test(resp),
      mentions_mechanism: /nervesystem|dæmp|selvmedic|flugt|bedøv|tolerance/i.test(resp),
      to: result.transition?.to,
    }
  } catch (e) { out.capability_run = { error: String(e) } }

  res.setHeader("Cache-Control", "no-store")
  return res.status(200).json(out)
}

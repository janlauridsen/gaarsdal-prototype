// chat/analytics/usage.ts
// Anonym brugstælling — GDPR-ren. Tæller KUN at en dialog/tur fandt sted,
// per bot-type og per dag. Ingen personoplysninger, intet indhold, ingen IP.
// Buckets: gaarsdal:usage:{botType}:total og gaarsdal:usage:{botType}:day:{YYYY-MM-DD}
import { getRedisClient } from "../persistence/redis"

export type UsageBotType = "alcohol" | "children" | "standard"

const DAY_TTL_SECONDS = 180 * 24 * 60 * 60 // dagsbuckets holdes i 180 dage

function todayKey(): string {
  // Europe/Copenhagen dato (YYYY-MM-DD)
  const d = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Copenhagen" })
  return d // en-CA giver ISO-format YYYY-MM-DD
}

// Kaldes når en NY dialog starter (første tur). Best-effort, må aldrig kaste.
export async function bumpDialogStarted(botType: UsageBotType): Promise<void> {
  try {
    const client = getRedisClient()
    if (!client) return
    const day = todayKey()
    await Promise.all([
      client.incr(`gaarsdal:usage:${botType}:dialogs:total`),
      client.incr(`gaarsdal:usage:${botType}:dialogs:day:${day}`),
    ])
    // TTL på dagsbucket (sættes hver gang; harmløst)
    await client.expire(`gaarsdal:usage:${botType}:dialogs:day:${day}`, DAY_TTL_SECONDS)
  } catch {
    // Tælling er best-effort
  }
}

// Kaldes ved hver bruger-tur. Best-effort.
export async function bumpTurn(botType: UsageBotType): Promise<void> {
  try {
    const client = getRedisClient()
    if (!client) return
    const day = todayKey()
    await Promise.all([
      client.incr(`gaarsdal:usage:${botType}:turns:total`),
      client.incr(`gaarsdal:usage:${botType}:turns:day:${day}`),
    ])
    await client.expire(`gaarsdal:usage:${botType}:turns:day:${day}`, DAY_TTL_SECONDS)
  } catch {
    // best-effort
  }
}

// Kaldes når en sikkerheds-hard-stop udløses (krise/afhængighed) — aggregeret tæller.
export async function bumpSafetyEvent(botType: UsageBotType, kind: "crisis" | "dependency"): Promise<void> {
  try {
    const client = getRedisClient()
    if (!client) return
    await client.incr(`gaarsdal:usage:${botType}:safety:${kind}:total`)
  } catch {
    // best-effort
  }
}

// Læser alle tællere for admin-visning.
export async function readUsage(botTypes: UsageBotType[], days: number): Promise<any> {
  const client = getRedisClient()
  if (!client) return { enabled: false }

  // Byg dagsnøgler for de seneste N dage
  const dayLabels: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    dayLabels.push(d.toLocaleDateString("en-CA", { timeZone: "Europe/Copenhagen" }))
  }

  const result: any = { enabled: true, days: dayLabels, bots: {} }

  for (const bot of botTypes) {
    const totalKeys = [
      `gaarsdal:usage:${bot}:dialogs:total`,
      `gaarsdal:usage:${bot}:turns:total`,
      `gaarsdal:usage:${bot}:safety:crisis:total`,
      `gaarsdal:usage:${bot}:safety:dependency:total`,
    ]
    const dialogDayKeys = dayLabels.map(d => `gaarsdal:usage:${bot}:dialogs:day:${d}`)
    const turnDayKeys = dayLabels.map(d => `gaarsdal:usage:${bot}:turns:day:${d}`)

    const [totals, dialogDays, turnDays] = await Promise.all([
      client.mget<(number | null)[]>(...totalKeys),
      dialogDayKeys.length ? client.mget<(number | null)[]>(...dialogDayKeys) : Promise.resolve([]),
      turnDayKeys.length ? client.mget<(number | null)[]>(...turnDayKeys) : Promise.resolve([]),
    ])

    result.bots[bot] = {
      dialogs_total: Number(totals?.[0] ?? 0),
      turns_total: Number(totals?.[1] ?? 0),
      crisis_total: Number(totals?.[2] ?? 0),
      dependency_total: Number(totals?.[3] ?? 0),
      dialogs_by_day: (dialogDays as (number | null)[]).map(v => Number(v ?? 0)),
      turns_by_day: (turnDays as (number | null)[]).map(v => Number(v ?? 0)),
    }
  }

  return result
}

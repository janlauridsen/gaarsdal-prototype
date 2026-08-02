/**
 * selvrefleksion.ts
 *
 * Selvrefleksion-tilstand for skema-flowet (/agteskab m.fl.).
 *
 * Problemet denne fil løser:
 *  1) Tilstanden var tidligere kun udledt af userText-præfikset. Den døde derfor
 *     i det sekund brugeren skrev en almindelig besked — altså præcis når dialogen
 *     begyndte. Her persisteres den i meta og lever indtil et eksplicit exit-signal.
 *  2) Skema-inputtet var en flad datadump. Her beregnes et signal (tyngdepunkt,
 *     åbningsudsagn, delta siden sidste indsendelse) som prompten kan handle på,
 *     i stedet for at bede modellen om at finde mening i 24 afkrydsninger.
 *
 * Exit er whitelist-baseret: kun eksplicitte signaler lukker tilstanden
 * (praktisk forespørgsel, readiness, afslutning) eller et turn-loft.
 */

import { AiCapabilityContext } from "../../types"

export const SELVREFLEKSION_PREFIX = "[SELVREFLEKSION_KONTEKST]:"

/** Hårdt loft så tilstanden ikke kan hænge fast i en lang samtale. */
export const SELVREFLEKSION_MAX_TURNS = 10

export type SelvrefleksionState = {
  active: boolean
  ctx: string | null
  /** Antal assistent-ture siden skemaet blev indsendt (0 = selve indsendelsen). */
  turns: number
}

export type SelvrefleksionResolved = {
  state: SelvrefleksionState
  /** Rå skema-kontekst — kun sat når tilstanden er aktiv. */
  promptContext: string | null
  /** Beregnet signalblok — kun sat når tilstanden er aktiv. */
  promptSignal: string | null
  /** True når tilstanden lige er skiftet fra inaktiv/anden ctx til aktiv. */
  isEntry: boolean
}

const INACTIVE: SelvrefleksionState = { active: false, ctx: null, turns: 0 }

// ─── Input-detektion ─────────────────────────────────────────────────────────

export function isSelvrefleksionInput(userText: string): boolean {
  return userText.trimStart().startsWith(SELVREFLEKSION_PREFIX)
}

export function extractSelvrefleksionCtx(userText: string): string | null {
  if (!isSelvrefleksionInput(userText)) return null
  const raw = userText.trimStart().slice(SELVREFLEKSION_PREFIX.length).trim()
  return raw.length > 0 ? raw : null
}

// ─── Meta-læsning ────────────────────────────────────────────────────────────

function readMetaValue(context: AiCapabilityContext, key: string): unknown {
  return (context.state.meta?.[key] as { value?: unknown } | undefined)?.value
}

export function readSelvrefleksionState(context: AiCapabilityContext): SelvrefleksionState {
  const ctxRaw = readMetaValue(context, "selvrefleksion.ctx")
  const turnsRaw = readMetaValue(context, "selvrefleksion.turns")
  return {
    active: readMetaValue(context, "selvrefleksion.active") === true,
    ctx: typeof ctxRaw === "string" && ctxRaw.trim() ? ctxRaw : null,
    turns: Number.isFinite(Number(turnsRaw)) ? Number(turnsRaw) : 0,
  }
}

export function buildSelvrefleksionMeta(state: SelvrefleksionState): Record<string, unknown> {
  return {
    "selvrefleksion.active": state.active,
    "selvrefleksion.ctx": state.ctx,
    "selvrefleksion.turns": state.turns,
  }
}

// ─── Parsing af skema-strengen ───────────────────────────────────────────────
//
// Format leveret af components/RefleksionsSkema.tsx (buildCtxParam):
//   Emne: <titel> | Bruger har markeret N ud af M udsagn. | <Kategori> (n/m): "a", "b" | ...

export type ParsedCategory = {
  title: string
  score: number
  of: number
  statements: string[]
}

export type ParsedSkema = {
  emne: string | null
  marked: number
  total: number
  categories: ParsedCategory[]
  /** Kategorier hvor brugeren ikke har sat et eneste kryds. */
  untouched: string[]
}

const CATEGORY_RE = /^(.+?)\s+\((\d+)\/(\d+)\):\s*(.*)$/

function splitStatements(raw: string): string[] {
  const out: string[] = []
  const re = /"([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    const s = m[1].trim()
    if (s) out.push(s)
  }
  return out
}

export function parseSkemaCtx(ctx: string): ParsedSkema {
  const parts = ctx.split("|").map((p) => p.trim()).filter(Boolean)
  const result: ParsedSkema = { emne: null, marked: 0, total: 0, categories: [], untouched: [] }

  for (const part of parts) {
    const emneMatch = part.match(/^Emne:\s*(.+)$/)
    if (emneMatch) {
      result.emne = emneMatch[1].trim()
      continue
    }
    const antalMatch = part.match(/markeret\s+(\d+)\s+ud af\s+(\d+)/)
    if (antalMatch) {
      result.marked = Number(antalMatch[1])
      result.total = Number(antalMatch[2])
      continue
    }
    const untouchedMatch = part.match(/^Ikke markeret:\s*(.+)$/)
    if (untouchedMatch) {
      result.untouched = untouchedMatch[1]
        .split(",")
        .map((t) => t.replace(/\s*\(\d+\/\d+\)\s*$/, "").trim())
        .filter(Boolean)
      continue
    }
    const catMatch = part.match(CATEGORY_RE)
    if (catMatch) {
      result.categories.push({
        title: catMatch[1].trim(),
        score: Number(catMatch[2]),
        of: Number(catMatch[3]),
        statements: splitStatements(catMatch[4]),
      })
    }
  }

  return result
}

function allStatements(parsed: ParsedSkema): string[] {
  return parsed.categories.flatMap((c) => c.statements)
}

/** Tyngdepunkt: højeste andel markeret, tiebreak på absolut antal. */
function topCategory(parsed: ParsedSkema): ParsedCategory | null {
  const ranked = [...parsed.categories]
    .filter((c) => c.score > 0 && c.of > 0)
    .sort((a, b) => b.score / b.of - a.score / a.of || b.score - a.score)
  return ranked[0] ?? null
}

// ─── Signalblok ──────────────────────────────────────────────────────────────

export function buildSkemaSignal(params: {
  current: string
  previous: string | null
  turns: number
}): string {
  const parsed = parseSkemaCtx(params.current)
  const lines: string[] = []

  // Efter indsendelsen er skemaet kvitteret. Så skal signalet være kort og
  // pege væk fra markeringerne — ellers begynder modellen at opsummere igen.
  if (params.turns > 0) {
    const topLater = topCategory(parsed)
    return (
      `BEREGNET SIGNAL FRA SKEMAET (baggrund — omtal det ikke):\n` +
      (topLater ? `- Tyngdepunktet var "${topLater.title}".\n` : "") +
      `- Tur ${params.turns} i denne selvrefleksion-dialog. Skemaet er kvitteret.\n` +
      `- Referér ikke til markeringer, kategorier eller antal igen. Bliv i det brugeren selv har skrevet siden.`
    )
  }

  if (parsed.total > 0) {
    lines.push(`- Omfang: ${parsed.marked} af ${parsed.total} udsagn markeret.`)
  }

  const top = topCategory(parsed)
  if (top) {
    lines.push(`- Tyngdepunkt: "${top.title}" (${top.score} af ${top.of} markeret) — det er her flest kryds er sat.`)
  }

  const fullyMarked = parsed.categories.filter((c) => c.of > 0 && c.score === c.of).map((c) => c.title)
  if (fullyMarked.length > 0) {
    lines.push(`- Fuldt markeret: ${fullyMarked.join(", ")}. Det er ikke tilfældigt — brugeren har sagt ja til alt i disse områder.`)
  }

  if (parsed.untouched.length > 0 && parsed.categories.length > 0) {
    lines.push(
      `- Helt uberørt: ${parsed.untouched.join(", ")}. Kontrasten mellem det de har krydset af og det de har ladet stå tomt er i sig selv information — men nævn den ikke som en analyse.`,
    )
  }

  // Delta i forhold til forrige indsendelse
  let added: string[] = []
  let unchangedResubmit = false
  if (params.previous) {
    if (params.previous.trim() === params.current.trim()) {
      unchangedResubmit = true
      lines.push(
        `- Genindsendelse UDEN ændringer: brugeren har sendt det samme skema igen. ` +
          `Opsummer det IKKE på ny. Spørg i stedet ind til noget de allerede har fortalt, eller til ét konkret udsagn du endnu ikke har berørt.`,
      )
    } else {
      const prevSet = new Set(allStatements(parseSkemaCtx(params.previous)))
      const currentAll = allStatements(parsed)
      added = currentAll.filter((s) => !prevSet.has(s))
      const removed = [...prevSet].filter((s) => !currentAll.includes(s))
      if (added.length > 0) {
        lines.push(`- Nyt siden sidste indsendelse: ${added.map((s) => `"${s}"`).join(", ")}. Det er her bevægelsen er.`)
      }
      if (removed.length > 0) {
        lines.push(`- Fravalgt siden sidst: ${removed.map((s) => `"${s}"`).join(", ")}. Nævn det ikke direkte.`)
      }
      if (added.length === 0 && removed.length === 0) {
        lines.push(`- Ingen reel ændring siden sidste indsendelse.`)
      }
    }
  }

  // Åbningsudsagn — kun på selve indsendelsen, og ikke ved uændret genindsendelse
  if (!unchangedResubmit) {
    const opener = added[0] ?? top?.statements[0] ?? allStatements(parsed)[0] ?? null
    if (opener) {
      lines.push(`- ÅBNINGSUDSAGN (citér dette ordret i dit svar): "${opener}"`)
    }
  }

  if (lines.length === 0) return ""

  return `BEREGNET SIGNAL FRA SKEMAET (handl på dette — læs ikke listen op):\n${lines.join("\n")}`
}

// ─── Resolver ────────────────────────────────────────────────────────────────

export function resolveSelvrefleksion(params: {
  context: AiCapabilityContext
  userText: string
  policySignals?: {
    is_practical_request?: boolean
    is_closing?: boolean
    is_ready_signal?: boolean
  }
}): SelvrefleksionResolved {
  const previous = readSelvrefleksionState(params.context)
  const incoming = extractSelvrefleksionCtx(params.userText)

  // 1) Skema indsendt (første gang eller igen) → aktivér og nulstil turn-tælleren.
  if (incoming) {
    return {
      state: { active: true, ctx: incoming, turns: 0 },
      promptContext: incoming,
      promptSignal: buildSkemaSignal({ current: incoming, previous: previous.ctx, turns: 0 }),
      isEntry: true,
    }
  }

  // 2) Ikke i selvrefleksion → rør ikke ved noget.
  if (!previous.active || !previous.ctx) {
    return { state: previous.active ? { ...previous, active: false } : INACTIVE, promptContext: null, promptSignal: null, isEntry: false }
  }

  // 3) Eksplicit exit (whitelist) eller turn-loft → luk tilstanden.
  const nextTurns = previous.turns + 1
  // Bemærk: is_ready_signal er BEVIDST ikke et exit-signal. I en refleksionsdialog
  // er "ja" / "det giver mening" en fortsættelse, ikke accept af en invitation.
  // Kun eksplicit praktisk forespørgsel eller afslutning lukker tilstanden.
  const explicitExit =
    params.policySignals?.is_practical_request === true ||
    params.policySignals?.is_closing === true

  if (explicitExit || nextTurns > SELVREFLEKSION_MAX_TURNS) {
    return {
      state: { active: false, ctx: previous.ctx, turns: previous.turns },
      promptContext: null,
      promptSignal: null,
      isEntry: false,
    }
  }

  // 4) Fortsæt dialogen med tilstanden i behold.
  return {
    state: { active: true, ctx: previous.ctx, turns: nextTurns },
    promptContext: previous.ctx,
    promptSignal: buildSkemaSignal({ current: previous.ctx, previous: null, turns: nextTurns }),
    isEntry: false,
  }
}

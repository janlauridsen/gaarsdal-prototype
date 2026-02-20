import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type Relevance = "YES" | "SUPPLEMENT" | "NO" | "NEEDS_ASSESSMENT"
type Confidence = "low" | "medium" | "high"

type Chip = { id: string; label: string }

type Output = {
  assistant_message: string
  summary?: string
  relevance?: Relevance
  confidence?: Confidence
  tags?: string[]
  asked_clarifying_question?: boolean
  next_question?: string
  close_signal?: boolean
  chips?: Chip[]
}

const MAX_TRANSCRIPT_ENTRIES = 10
const MAX_QUESTIONS = 4

const ALT_WHITELIST = [
  "Massage",
  "Osteopati",
  "manipulative terapier",
  "Zoneterapi",
  "Akupunktur",
  "Kiropraktik",
  "Healing",
  "Reiki",
  "Homøopati",
  "Kosttilskud",
  "Mindfulness",
  "meditation",
] as const

const METHOD_FIT_PROMPT = `
Du er en neutral beslutningsstøtte i dansk kontekst.
Du hjælper brugeren med at vurdere:

1) Hvad der typisk er førstevalg i Danmark for denne problemtype
2) Hvilke alternative behandlingsformer der ofte anvendes
3) Hvor (og om) hypnoterapi passer ind

VIGTIGT – HARD RULES:

- Du skal ALTID nævne mindst ét konkret alternativ til hypnoterapi.
- Alternativet skal være relevant for problemtypen.
- Alternativer må kun vælges fra denne whitelist:

  - Massage
  - Osteopati / manipulative terapier
  - Zoneterapi
  - Akupunktur
  - Kiropraktik
  - Healing (fx Reiki)
  - Homøopati
  - Kosttilskud (ikke-ordinerede)
  - Mindfulness / meditation

- Hvis problemtypen er:
    • Neuro-udviklingsforstyrrelse (fx ADHD)
    • Medicinsk/fysiologisk lidelse
    • Psykiatrisk tilstand
  skal evidensbaseret standardbehandling nævnes først.
  Hypnoterapi må her kun beskrives som supplement.

- Ingen behandling, øvelser eller teknikker.
- Ingen garantier.
- Ingen terapeutisk tone.
- Fokus på overblik og positionering.

STRUKTURKRAV:

Svar skal have denne rækkefølge:

1) Typiske førstevalg / Alternativer i Danmark
2) Hvor hypnoterapi typisk placeres
3) Kort konklusion (YES | SUPPLEMENT | NO | NEEDS_ASSESSMENT)

Soft-close regel:
Hvis brugeren stiller et sammenlignende opfølgende spørgsmål
(fx "er hypnose bedre?", "hvad er bedst?", "hvorfor?")
må du svare komparativt – ikke afvise eller lukke dialogen.

Returner KUN gyldig JSON:

{
  "assistant_message": string,
  "summary": string,
  "relevance": "YES" | "SUPPLEMENT" | "NO" | "NEEDS_ASSESSMENT",
  "confidence": "low" | "medium" | "high",
  "tags": string[],
  "asked_clarifying_question": boolean,
  "next_question": string,
  "close_signal": boolean,
  "chips": [{"id": string, "label": string}]
}
`

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["method_fit.transcript"]?.value
  if (!Array.isArray(raw)) return []
  const turns: TranscriptTurn[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const obj = item as any
    if ((obj.role === "user" || obj.role === "assistant") && typeof obj.content === "string") {
      const content = obj.content.trim()
      if (content) turns.push({ role: obj.role, content })
    }
  }
  return turns.slice(-MAX_TRANSCRIPT_ENTRIES)
}

function appendTranscript(previous: TranscriptTurn[], userText: string, assistantText: string): TranscriptTurn[] {
  const next = [...previous]
  const u = (userText ?? "").trim()
  const a = (assistantText ?? "").trim()
  if (u) next.push({ role: "user", content: u })
  if (a) next.push({ role: "assistant", content: a })
  return next.slice(-MAX_TRANSCRIPT_ENTRIES)
}

function readNumberMeta(context: AiCapabilityContext, key: string, fallback = 0): number {
  const v = context.state.meta[key]?.value
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string") {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function normalizeRelevance(v: unknown): Relevance | undefined {
  if (v === "YES" || v === "SUPPLEMENT" || v === "NO" || v === "NEEDS_ASSESSMENT") return v
  return undefined
}

function normalizeConfidence(v: unknown): Confidence | undefined {
  if (v === "low" || v === "medium" || v === "high") return v
  return undefined
}

function normalizeChips(v: unknown): Chip[] | undefined {
  if (!Array.isArray(v)) return undefined
  const out: Chip[] = []
  for (const item of v) {
    if (!item || typeof item !== "object") continue
    const obj = item as any
    const id = typeof obj.id === "string" ? obj.id.trim() : ""
    const label = typeof obj.label === "string" ? obj.label.trim() : ""
    if (!id || !label) continue
    out.push({ id, label })
    if (out.length >= 2) break
  }
  return out.length ? out : undefined
}

function normalizeOutput(raw: Record<string, unknown> | null): Output | null {
  if (!raw) return null

  const msg = typeof raw.assistant_message === "string" ? raw.assistant_message.trim() : ""
  if (!msg) return null

  const summary = typeof raw.summary === "string" ? raw.summary.trim() : undefined
  const relevance = normalizeRelevance(raw.relevance)
  const confidence = normalizeConfidence(raw.confidence)

  const tagsRaw = raw.tags
  const tags =
    Array.isArray(tagsRaw) && tagsRaw.every((x) => typeof x === "string")
      ? (tagsRaw as string[]).map((s) => s.trim()).filter(Boolean).slice(0, 10)
      : undefined

  const asked =
    typeof raw.asked_clarifying_question === "boolean" ? raw.asked_clarifying_question : undefined

  const nextQ = typeof raw.next_question === "string" ? raw.next_question.trim() : undefined
  const close = typeof raw.close_signal === "boolean" ? raw.close_signal : undefined
  const chips = normalizeChips(raw.chips)

  return {
    assistant_message: msg,
    summary,
    relevance,
    confidence,
    tags,
    asked_clarifying_question: asked,
    next_question: nextQ,
    close_signal: close,
    chips,
  }
}

function hasWhitelistedAlternative(text: string): boolean {
  const t = (text ?? "").toLowerCase()
  return ALT_WHITELIST.some((k) => t.includes(String(k).toLowerCase()))
}

function chooseFallbackAlternatives(tags?: string[]): string[] {
  const t = (tags ?? []).map((x) => x.toLowerCase())
  const has = (s: string) => t.some((x) => x.includes(s))

  // Heuristics: pick 2 max, from whitelist.
  if (has("adhd") || has("neuro") || has("koncentration") || has("studie")) return ["Mindfulness / meditation", "Massage"]
  if (has("mave") || has("fordøj") || has("ibs")) return ["Akupunktur", "Zoneterapi"]
  if (has("smerte") || has("hovedpine") || has("migræne")) return ["Akupunktur", "Massage"]
  if (has("stress") || has("søvn") || has("uro")) return ["Mindfulness / meditation", "Massage"]
  return ["Mindfulness / meditation"]
}

function ensureAtLeastOneAlternative(out: Output): Output {
  if (hasWhitelistedAlternative(out.assistant_message)) return out

  const alts = chooseFallbackAlternatives(out.tags)
  const lines = [
    out.assistant_message.trim(),
    "",
    "Alternativer i Danmark (typisk):",
    ...alts.map((a) => `• ${a}`),
  ].join("\n")

  return { ...out, assistant_message: lines }
}

function isComparativeFollowUp(userText: string): boolean {
  const t = (userText ?? "").trim().toLowerCase()
  if (!t) return false
  const patterns = [
    "er hypno bedre",
    "er hypnose bedre",
    "bedre end",
    "hvad er bedst",
    "hvad er bedre",
    "sammenlign",
    "vs",
    "kontra",
    "i forhold til",
    "hvorfor",
    "hvorfor ikke",
    "hvorfor ja",
    "hvad ville du vælge",
    "hvad anbefaler du",
  ]
  return patterns.some((p) => t.includes(p))
}

function buildClosedFollowUpFallback(userText: string): Output {
  // Short, comparative, repeats at least one alternative; no new questions.
  return ensureAtLeastOneAlternative({
    assistant_message:
      "Som tommelfingerregel er hypnoterapi sjældent “bedre” end etablerede førstevalg for kerneproblemet, men kan være et supplement ved stress, søvn eller nervesystem-ro. Alternativer som Mindfulness / meditation bruges ofte som supplement i Danmark; ved kropslige spændinger kan Massage også være relevant. Det vigtigste er at matche indsatsen til det primære problem og det du vil opnå.",
    summary: "",
    relevance: "SUPPLEMENT",
    confidence: "medium",
    asked_clarifying_question: false,
    next_question: "",
    close_signal: true,
    tags: ["comparison", "overview"],
  })
}

function buildFallback(userText: string, questionsRemaining: number): Output {
  if (questionsRemaining <= 0) {
    return ensureAtLeastOneAlternative({
      assistant_message:
        "Jeg kan give et generelt overblik: ved mange temaer er de mest almindelige førstevalg i Danmark enten sundhedsfaglig vurdering/standardtiltag eller praktiske tilpasninger, og alternativ behandling bruges ofte som supplement. Hypnoterapi kan være relevant som supplement i nogle tilfælde, men afhænger af problemtypen.",
      summary: "",
      relevance: "NEEDS_ASSESSMENT",
      confidence: "low",
      asked_clarifying_question: false,
      next_question: "",
      close_signal: true,
      tags: ["overview"],
    })
  }

  return ensureAtLeastOneAlternative({
    assistant_message:
      "For at kunne give et kort og relevant overblik: hvad er dit primære mål (fx færre symptomer, bedre søvn, mindre stress, mere fokus), og hvad har du allerede prøvet?",
    summary: "",
    relevance: "NEEDS_ASSESSMENT",
    confidence: "low",
    asked_clarifying_question: true,
    next_question: "Hvad er dit primære mål, og hvad har du allerede prøvet?",
    close_signal: false,
    tags: ["clarify"],
  })
}

function enforceBudgetAndClose(
  parsed: Output,
  questionsUsed: number
): { output: Output; questionsUsed: number; questionsRemaining: number } {
  const asked =
    typeof parsed.asked_clarifying_question === "boolean"
      ? parsed.asked_clarifying_question
      : typeof parsed.next_question === "string" && parsed.next_question.trim().endsWith("?")

  let nextUsed = questionsUsed + (asked ? 1 : 0)
  if (nextUsed > MAX_QUESTIONS) nextUsed = MAX_QUESTIONS
  const remaining = Math.max(0, MAX_QUESTIONS - nextUsed)

  const relevanceFinal =
    parsed.relevance === "YES" || parsed.relevance === "SUPPLEMENT" || parsed.relevance === "NO"

  const shouldClose = parsed.close_signal === true || remaining <= 0 || relevanceFinal

  let out: Output = { ...parsed }

  // Before close: we avoid chips (no steering). After close: chips allowed (max 2), but not required.
  if (shouldClose) {
    out.close_signal = true
    out.next_question = ""
    out.asked_clarifying_question = false
    if (out.chips) out.chips = out.chips.slice(0, 2)
  } else {
    out.close_signal = false
    out.chips = undefined
    // Ensure only a single concrete question
    out.next_question = (out.next_question ?? "").trim()
  }

  // Hard rule: always include at least one whitelisted alternative
  out = ensureAtLeastOneAlternative(out)

  // If budget exhausted, force close even if model forgot.
  if (!out.close_signal && remaining <= 0) {
    out.close_signal = true
    out.next_question = ""
    out.asked_clarifying_question = false
  }

  return { output: out, questionsUsed: nextUsed, questionsRemaining: remaining }
}

export const methodFitCapability: AiCapability = {
  id: "method-fit-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const contextSystem = (context.contextPack?.system ?? "").trim()

    const questionsUsed0 = readNumberMeta(context, "method_fit.question_count", 0)
    const close0 = Boolean(context.state.meta["method_fit.close_signal"]?.value === true)
    const questionsRemaining0 = Math.max(0, MAX_QUESTIONS - questionsUsed0)
    const userText = context.userText ?? ""

    // Soft-close: if we are closed but user asks a comparative follow-up, answer briefly instead of blocking.
    if (close0 && isComparativeFollowUp(userText)) {
      const out = buildClosedFollowUpFallback(userText)
      const updatedTranscript = appendTranscript(transcript, userText, out.assistant_message)

      const meta_delta: Record<string, unknown> = {
        "method_fit.transcript": updatedTranscript,
        "method_fit.close_signal": true,
        "method_fit.question_count": questionsUsed0,
        "method_fit.questions_remaining": questionsRemaining0,
        "method_fit.relevance": out.relevance ?? "SUPPLEMENT",
        "method_fit.confidence": out.confidence ?? "medium",
        "method_fit.tags": out.tags ?? ["comparison", "overview"],
      }

      if (out.summary) meta_delta["method_fit.summary"] = out.summary
      if (out.chips) meta_delta["method_fit.chips"] = out.chips

      const transition: Transition = {
        type: "NODE_HOP",
        from: context.state.active_node,
        reason: "method-fit-soft-close-followup",
        response_message: out.assistant_message,
        meta_delta,
      }

      return { transition, debug: { capability: "method-fit-v1", used_fallback: true } }
    }

    // If closed and not a comparative follow-up: keep stable guidance (no “start forfra”-tone).
    if (close0) {
      const msg = ensureAtLeastOneAlternative({
        assistant_message:
          "Hvis du vil have et nyt overblik for en anden situation, så start en ny runde i ‘Hypnoterapi eller et bedre alternativ?’. Hvis du spørger til sammenligning (fx ‘er hypnose bedre end …?’), kan jeg også svare kort på det.",
        relevance: context.state.meta["method_fit.relevance"]?.value as any,
        confidence: context.state.meta["method_fit.confidence"]?.value as any,
        tags: context.state.meta["method_fit.tags"]?.value as any,
        close_signal: true,
        next_question: "",
        asked_clarifying_question: false,
        summary: "",
      })

      const updatedTranscript = appendTranscript(transcript, userText, msg.assistant_message)

      const transition: Transition = {
        type: "NODE_HOP",
        from: context.state.active_node,
        reason: "method-fit-closed",
        response_message: msg.assistant_message,
        meta_delta: {
          "method_fit.transcript": updatedTranscript,
          "method_fit.close_signal": true,
        },
      }
      return { transition, debug: { capability: "method-fit-v1", used_fallback: true } }
    }

    const payload = {
      model: process.env.METHOD_FIT_MODEL ?? process.env.TRIAGE_MODEL ?? "gpt-4.1-mini",
      temperature: 0.3,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: METHOD_FIT_PROMPT },
        ...(contextSystem ? [{ role: "system" as const, content: contextSystem }] : []),
        {
          role: "user" as const,
          content: JSON.stringify({
            conversation_transcript: transcript,
            user_input: userText,
            question_budget: {
              max_questions: MAX_QUESTIONS,
              questions_used: questionsUsed0,
              questions_remaining: questionsRemaining0,
            },
            instruction:
              "Stil højst ét konkret afklarende spørgsmål hvis nødvendigt; ellers giv overblik + positionering + konklusion.",
          }),
        },
      ],
    }

    const response = await llm.chatJson(payload)
    const parsed0 = normalizeOutput(response) ?? buildFallback(userText, questionsRemaining0)
    const enforced = enforceBudgetAndClose(parsed0, questionsUsed0)
    const parsed = enforced.output

    const updatedTranscript = appendTranscript(transcript, userText, parsed.assistant_message)

    const meta_delta: Record<string, unknown> = {
      "method_fit.transcript": updatedTranscript,
      "method_fit.question_count": enforced.questionsUsed,
      "method_fit.questions_remaining": enforced.questionsRemaining,
      "method_fit.close_signal": parsed.close_signal === true,
    }

    if (parsed.summary) meta_delta["method_fit.summary"] = parsed.summary
    if (parsed.relevance) meta_delta["method_fit.relevance"] = parsed.relevance
    if (parsed.confidence) meta_delta["method_fit.confidence"] = parsed.confidence
    if (parsed.tags) meta_delta["method_fit.tags"] = parsed.tags
    if (parsed.next_question) meta_delta["method_fit.next_question"] = parsed.next_question
    if (parsed.chips) meta_delta["method_fit.chips"] = parsed.chips

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "method-fit-free-text",
      response_message: parsed.assistant_message,
      meta_delta,
    }

    return {
      transition,
      debug: {
        capability: "method-fit-v1",
        used_fallback: !response,
      },
    }
  },
}

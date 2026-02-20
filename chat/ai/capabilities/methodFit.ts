import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type Relevance = "YES" | "SUPPLEMENT" | "NO" | "NEEDS_ASSESSMENT"

type Confidence = "low" | "medium" | "high"

type Output = {
  assistant_message: string
  summary?: string

  // v2 fields (optional for backward compatibility)
  relevance?: Relevance
  confidence?: Confidence
  tags?: string[]

  // question-budget discipline
  asked_clarifying_question?: boolean
  next_question?: string

  // close discipline
  close_signal?: boolean

  // optional UI hints (kept minimal)
  chips?: Array<{ id: string; label: string }>
}

const MAX_TRANSCRIPT_ENTRIES = 10
const MAX_QUESTIONS = 4

const METHOD_FIT_PROMPT = `Du er en beslutningsstøttende guide der hjælper brugeren med at vurdere:
- om hypnoterapi typisk er et godt match
- om hypnoterapi typisk er et supplement
- eller om andre tilgange typisk passer bedre

VIGTIGT (hard rules):
- Du giver kun overblik og positionering — ikke behandling, ikke øvelser, ikke teknikker.
- Ingen diagnostik. Ingen garantier.
- Tone: saglig, rolig, dansk, ikke-terapeutisk (undgå "det lyder hårdt" osv.).
- Maks 4 afklarende spørgsmål i alt for hele episoden. (systemet holder tæller)
- Spørg kun hvis nødvendigt for at kunne give et bedre overblik.
- Når der er nok viden: konkludér og sæt close_signal=true og next_question="".
- Hvis spørgebudget er opbrugt: konkludér ud fra det du har, close_signal=true og next_question="".
- Ingen “vil du høre mere?” eller tilsvarende invitationer til dybde.

Ansvar ved fysiske symptomer:
- Ved fysiske symptomer (fx mave/afføring, smerter, neurologisk): spørg kort om lægelig udredning/diagnose,
  og nævn at lægelig vurdering typisk er relevant, især ved lang varighed eller bekymrende symptomer.
- Hypnoterapi ændrer sjældent strukturelle/medicinske tilstande direkte, men kan være relevant for sekundære mål
  (stressrespons, søvn, smerteoplevelse, mestring, vane/trigger-mønstre) når det passer.

Du skal returnere KUN gyldig JSON i formatet:
{
  "assistant_message": string,
  "summary": string (optional),
  "relevance": "YES"|"SUPPLEMENT"|"NO"|"NEEDS_ASSESSMENT",
  "confidence": "low"|"medium"|"high",
  "tags": string[] (optional),

  "asked_clarifying_question": boolean,
  "next_question": string,
  "close_signal": boolean,

  "chips": [ {"id": string, "label": string} ] (optional)
}`

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

function normalizeChips(v: unknown): Array<{ id: string; label: string }> | undefined {
  if (!Array.isArray(v)) return undefined
  const out: Array<{ id: string; label: string }> = []
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
      ? (tagsRaw as string[]).map((s) => s.trim()).filter(Boolean).slice(0, 8)
      : undefined

  const asked = typeof raw.asked_clarifying_question === "boolean" ? raw.asked_clarifying_question : undefined
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

function buildFallback(userText: string, questionsRemaining: number): Output {
  const u = (userText ?? "").trim()

  if (questionsRemaining <= 0) {
    return {
      assistant_message:
        "Jeg kan give et generelt overblik: hypnose bruges ofte ved vane- og stressrelaterede mønstre, mens ved vedvarende fysiske symptomer er lægelig afklaring typisk første skridt.",
      summary: "",
      relevance: "NEEDS_ASSESSMENT",
      confidence: "low",
      asked_clarifying_question: false,
      next_question: "",
      close_signal: true,
    }
  }

  return {
    assistant_message: u
      ? "Tak. For at kunne give et kort overblik: er du blevet lægeligt undersøgt/udredt for symptomerne (fx hos egen læge)?"
      : "Er du blevet lægeligt undersøgt/udredt for symptomerne (fx hos egen læge)?",
    summary: "",
    relevance: "NEEDS_ASSESSMENT",
    confidence: "low",
    asked_clarifying_question: true,
    next_question: "Er du blevet lægeligt undersøgt/udredt for symptomerne (fx hos egen læge)?",
    close_signal: false,
  }
}

function enforceBudgetAndClose(
  parsed: Output,
  questionsUsed: number
): { output: Output; questionsUsed: number; questionsRemaining: number } {
  const asked =
    typeof parsed.asked_clarifying_question === "boolean"
      ? parsed.asked_clarifying_question
      : typeof parsed.next_question === "string" && parsed.next_question.trim().endsWith("?")

  let nextQuestionsUsed = questionsUsed + (asked ? 1 : 0)
  if (nextQuestionsUsed > MAX_QUESTIONS) nextQuestionsUsed = MAX_QUESTIONS
  const nextRemaining = Math.max(0, MAX_QUESTIONS - nextQuestionsUsed)

  const decidedRelevance = parsed.relevance === "YES" || parsed.relevance === "SUPPLEMENT" || parsed.relevance === "NO"
  const shouldClose = parsed.close_signal === true || decidedRelevance || nextRemaining <= 0

  const out: Output = { ...parsed }

  if (shouldClose) {
    out.close_signal = true
    out.next_question = ""
    out.asked_clarifying_question = false
    if (out.chips) out.chips = out.chips.slice(0, 2)
  } else {
    out.close_signal = false
    out.chips = undefined

    const nq = (out.next_question ?? "").trim()
    out.next_question = nq
    out.asked_clarifying_question = asked

    if (!nq) {
      // Ensure we don't silently consume budget without asking anything meaningful.
      out.asked_clarifying_question = false
    }
  }

  return { output: out, questionsUsed: nextQuestionsUsed, questionsRemaining: nextRemaining }
}

export const methodFitCapability: AiCapability = {
  id: "method-fit-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const contextSystem = (context.contextPack?.system ?? "").trim()

    const questionsUsed0 = readNumberMeta(context, "method_fit.question_count", 0)
    const close0 = Boolean(context.state.meta["method_fit.close_signal"]?.value === true)
    const questionsRemaining0 = Math.max(0, MAX_QUESTIONS - questionsUsed0)

    if (close0) {
      const transition: Transition = {
        type: "NODE_HOP",
        from: context.state.active_node,
        reason: "method-fit-closed",
        response_message:
          "Jeg har givet et kort overblik i denne runde. Hvis du vil starte forfra med en ny problemstilling, så åbner du ‘Hypnoterapi eller et bedre alternativ?’ igen og beskriver den nye situation kort.",
        meta_delta: {
          "method_fit.close_signal": true,
        },
      }
      return {
        transition,
        debug: {
          capability: "method-fit-v1",
          used_fallback: true,
        },
      }
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
            user_input: context.userText ?? "",
            question_budget: {
              max_questions: MAX_QUESTIONS,
              questions_used: questionsUsed0,
              questions_remaining: questionsRemaining0,
            },
            instruction:
              "Stil højst ét konkret afklarende spørgsmål hvis nødvendigt; ellers giv overblik + positionering og luk.",
          }),
        },
      ],
    }

    const response = await llm.chatJson(payload)
    const parsed0 = normalizeOutput(response) ?? buildFallback(context.userText ?? "", questionsRemaining0)

    const enforced = enforceBudgetAndClose(parsed0, questionsUsed0)
    const parsed = enforced.output

    const updatedTranscript = appendTranscript(transcript, context.userText ?? "", parsed.assistant_message)

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
    if (parsed.next_question && parsed.next_question.trim()) meta_delta["method_fit.next_question"] = parsed.next_question
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

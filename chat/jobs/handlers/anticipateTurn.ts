// chat/jobs/handlers/anticipateTurn.ts
//
// Lookahead job: simulerer 2 træk frem (bruger → assistent → bruger → assistent)
// og producerer en retorisk instruktion til GEN_HYPNO om hvordan nuværende svar
// kan formuleres for at lede mod det mest frugtbare samtalespor.
//
// Fra turn 3+: tilføjes en conversation_goal_hypothesis — en hypotese om hvor
// samtalen naturligt ender (hvad har brugeren fået afklaret/besluttet?).
// Den bruges som nordstjerne for den retoriske instruktion.
//
// Output gemmes som draft med `kind: "anticipate_turn"`.
// Injiceres i contextPack kun hvis brugerens faktiske input er on-track
// (topic-overlap med `anticipated_user_text`).

import { createOpenAiCompatibleClient } from "../../ai/provider"
import { jobsTtlSeconds, writeJob } from "../store"
import { JobRecordV1, EvidenceRefV1 } from "../types"
import { nowMs } from "../../utils/time"

export type AnticipatePayload = {
  trigger_turn: number
  topic: string
  transcript_excerpt: string  // Seneste 6 turns som tekst
  active_node: string
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

// Cursor-trin
const CURSORS = ["INIT", "SIMULATE", "BUILD_INSTRUCTION", "DONE"] as const
type Cursor = typeof CURSORS[number]

function nextCursor(c: Cursor): Cursor {
  const idx = CURSORS.indexOf(c)
  return CURSORS[Math.min(idx + 1, CURSORS.length - 1)]
}

// ─── LLM: simuler 2 frem-træk og ekstraher retorisk instruktion ──────────────

async function llmSimulateAndInstruct(params: {
  topic: string
  transcript: string
  trigger_turn: number
}): Promise<{
  anticipated_user_text: string
  rhetorical_instruction: string
  conversation_goal_hypothesis: string | null
} | null> {
  const llm = createOpenAiCompatibleClient()
  const model = process.env.HYPNO_MODEL ?? "gpt-4.1-mini"

  const withGoal = params.trigger_turn >= 3

  const goalSection = withGoal
    ? "\nMÅL-HYPOTESE — Inden du formulerer den retoriske instruktion:\n" +
      "Overvej: Hvis denne samtale fortsætter naturligt de næste 3-5 træk — " +
      "hvad er det mest sandsynlige slutpunkt? " +
      "Formuler en 1-sætnings hypotese om hvad brugeren vil have fået afklaret eller besluttet " +
      "(fx: 'Brugeren forstår at alkoholen dækker over et stressbehov og overvejer at booke en tid'). " +
      "Skriv denne hypotese i feltet conversation_goal_hypothesis.\n" +
      "Brug derefter hypotesen aktivt: lad rhetorical_instruction pege subtilt mod dette mål " +
      "— ikke direkte, men ved at vælge en retorisk manøvre der åbner for det naturlige næste skridt.\n\n"
    : "\nconversation_goal_hypothesis skal sættes til null (samtalen er for kort til at vurdere retning).\n\n"

  const system =
    "Du er ekspert i terapeutisk samtaledesign. Du simulerer 2 fremtidige samtale-træk.\n\n" +
    "TRIN 1 — Forudsig brugerens næste besked (anticipated_user_text): " +
    "Hvad vil brugeren sandsynligvis skrive? Vær konkret og specifik — brug brugerens eget sproglige register.\n\n" +
    "TRIN 2 — Forudsig det ideelle assistentsvar på den besked.\n\n" +
    "TRIN 3 — Forudsig brugerens reaktion på DET svar. Hvad åbner det op for?\n\n" +
    goalSection +
    "TRIN 4 — Identificer: Hvilken SPECIFIK ÅBNING i brugerens seneste formulering " +
    "kan assistenten udnytte NU for at lede naturligt mod det frugtbare spor? " +
    "Hvad er den præcise retoriske manøvre? " +
    "(fx: spejl brugerens eget ord X tilbage, introducer distinktion mellem Y og Z, " +
    "hold pause ved den modsætning brugeren selv har antydet, navngiv det mønster brugeren beskriver, etc.)\n\n" +
    "TRIN 5 — Skriv rhetorical_instruction som EN konkret handlingsanvisning: " +
    "Hvad skal assistenten GØRE — ikke hvilken tone den skal have. " +
    "Instruksen skal referere til noget specifikt fra samtalen. " +
    "Den må ikke være generisk.\n\n" +
    "EKSEMPEL på DÅRLIG instruktion:\n" +
    "  'Brug en empatisk og udforskende tone.'\n\n" +
    "EKSEMPEL på GOD instruktion (uden mål-hypotese):\n" +
    "  'Spejl brugerens eget ord \"frirum\" og introducer distinktionen mellem " +
    "frirum-fra-noget og frirum-til-noget — det åbner for hvad brugeren egentlig ønsker sig.'\n\n" +
    "EKSEMPEL på GOD instruktion (med mål-hypotese om at bruger nærmer sig booking):\n" +
    "  'Navngiv det mønster brugeren beskriver som \"alkoholen som eneste pause\" og spørg " +
    "hvad der skulle til for at en anden slags pause føltes tilgængelig — det åbner for " +
    "at brugeren selv formulerer behovet for hjælp.'\n\n" +
    "Returner KUN JSON: { " +
    "\"anticipated_user_text\": string, " +
    "\"rhetorical_instruction\": string, " +
    "\"conversation_goal_hypothesis\": string | null " +
    "}"

  const user = `Emne: ${params.topic}\nTurn nummer: ${params.trigger_turn}\n\nSamtaleforløb:\n${params.transcript}`

  try {
    const raw = await llm.chatJson({
      model,
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    })
    const anticipated = asString((raw as any)?.anticipated_user_text).trim()
    const instruction = asString((raw as any)?.rhetorical_instruction).trim()
    const goalHypothesis = typeof (raw as any)?.conversation_goal_hypothesis === "string"
      ? (raw as any).conversation_goal_hypothesis.trim()
      : null

    if (!anticipated || !instruction) return null
    return {
      anticipated_user_text: anticipated,
      rhetorical_instruction: instruction,
      conversation_goal_hypothesis: goalHypothesis || null,
    }
  } catch {
    return null
  }
}

// ─── Tick-funktion ────────────────────────────────────────────────────────────

export async function tickAnticipate(job: JobRecordV1): Promise<{ job: JobRecordV1; completed: boolean }> {
  const cursor = (job.cursor as Cursor) ?? "INIT"
  const payload = job.payload as AnticipatePayload
  const work = (job.work ?? {}) as Record<string, unknown>
  const ts = nowMs()
  const ttl = jobsTtlSeconds()

  // INIT → SIMULATE
  if (cursor === "INIT") {
    return {
      job: {
        ...job,
        cursor: "SIMULATE",
        progress: 0.1,
        status: "running",
        updated_at: ts,
        work,
      },
      completed: false,
    }
  }

  // SIMULATE → BUILD_INSTRUCTION
  if (cursor === "SIMULATE") {
    const result = await llmSimulateAndInstruct({
      topic: payload.topic,
      transcript: payload.transcript_excerpt,
      trigger_turn: payload.trigger_turn,
    })

    if (!result) {
      return {
        job: {
          ...job,
          cursor: "DONE",
          status: "failed",
          last_error: "llm_simulate_failed",
          progress: 1,
          updated_at: ts,
        },
        completed: true,
      }
    }

    return {
      job: {
        ...job,
        cursor: "BUILD_INSTRUCTION",
        progress: 0.7,
        status: "running",
        updated_at: ts,
        work: {
          ...work,
          anticipated_user_text: result.anticipated_user_text,
          rhetorical_instruction: result.rhetorical_instruction,
          conversation_goal_hypothesis: result.conversation_goal_hypothesis,
        },
      },
      completed: false,
    }
  }

  // BUILD_INSTRUCTION → DONE
  if (cursor === "BUILD_INSTRUCTION") {
    const anticipated = asString(work.anticipated_user_text)
    const instruction = asString(work.rhetorical_instruction)
    const goalHypothesis = typeof work.conversation_goal_hypothesis === "string"
      ? work.conversation_goal_hypothesis
      : null

    if (!anticipated || !instruction) {
      return {
        job: { ...job, cursor: "DONE", status: "failed", last_error: "missing_work", progress: 1, updated_at: ts },
        completed: true,
      }
    }

    try {
      const { getRedisClient } = await import("../../persistence/redis")
      const client = getRedisClient()
      if (client) {
        const KEY_PREFIX = "gaarsdal:"
        const draftObj = {
          schema_version: "v1",
          job_id: job.job_id,
          conversation_id: job.conversation_id,
          kind: "anticipate_turn",
          summary_draft: instruction,
          conversation_goal_hypothesis: goalHypothesis,
          evidence: [] as EvidenceRefV1[],
          open_questions: [anticipated],
          created_at: ts,
          based_on_revision: job.based_on_revision,
          mode: job.mode,
        }
        const draftKey = `${KEY_PREFIX}anticipate:draft:conversation:${job.conversation_id}:${job.job_id}`
        const latestKey = `${KEY_PREFIX}anticipate:draft:latest:conversation:${job.conversation_id}`
        await client.set(draftKey, JSON.stringify(draftObj), { ex: ttl })
        await client.set(latestKey, job.job_id, { ex: ttl })
      }
    } catch {
      // Non-fatal
    }

    return {
      job: {
        ...job,
        cursor: "DONE",
        status: "completed",
        progress: 1,
        updated_at: ts,
        work: {
          ...work,
          trigger_turn: payload.trigger_turn,
          conversation_goal_hypothesis: goalHypothesis,
        },
      },
      completed: true,
    }
  }

  // DONE
  return { job: { ...job, cursor: "DONE", status: "completed", progress: 1, updated_at: ts }, completed: true }
}

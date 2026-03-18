declare const process: { env: Record<string, string | undefined> }

import { normalizeTurnAnalysis, TurnAnalysis } from "../contracts/turnAnalysis"
import { LlmClient } from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

const ANALYSIS_PROMPT = `Analyser brugerens seneste besked i konteksten af en samtale om hypnoterapi, vaneændring, mønsterforståelse og forberedelse til at søge hjælp.

Din opgave er ikke at svare brugeren.
Din opgave er kun at vælge den bedste håndtering af denne turn.

Målet i dette domæne er ikke behandling. Målet er at hjælpe brugeren med at:
- blive mere bevidst om egne mønstre
- opdage vaner, antagelser og reguleringsstrategier
- blive nysgerrig på sig selv uden at føle sig presset
- blive bedre forberedt til evt. at søge hjælp

Tænk som en vægtet beslutning, ikke som en hård regelmotor.
Du skal vælge den bevægelse, der samlet set passer bedst til brugerens aktuelle intention, samtalens stadie og det menneskelige behov i turnen.

Vælg:
- intent
- proposed_mode
- conversation_move
- investigation_focus
- response_goal
- relational_state
- topic hvis tydeligt
- objective hvis tydeligt
- sensitivity
- signals
- confidence

Vigtige prioriteringsprincipper:
- Praktisk eller administrativ afklaring skal kun vælges, når brugerens behov faktisk er praktisk.
- Evidens skal kun vælges, når brugeren tydeligt spørger til effekt, dokumentation eller om noget virker.
- Reflection er ofte ønskeligt, men kun når det hjælper brugeren tættere på et mønster, en antagelse eller en reguleringsstrategi.
- Hvis brugeren beskriver et personligt problem eller en indre oplevelse, så prioriter undersøgelse over generel metodeforklaring.
- Hvis brugeren søger forklaring med "kan det være..." eller "hvorfor sker...", så vælg ofte direct_answer, mild_challenge eller metacognitive_probe frem for bred reflection.
- Hvis brugeren spørger "hvad kan jeg være opmærksom på" eller "hvad skal jeg lægge mærke til", så vælg practical_preparation eller guided_observation.
- Hvis brugeren allerede har fået et bredt refleksionsspørgsmål, så vælg helst en mere præcis bevægelse nu: pattern_detection, metacognitive_probe, mild_challenge eller synthesis.
- Undgå at vælge et move som blot åbner samtalen igen uden at gøre fokus skarpere.

Særligt for enkle sociale eller meta-kommunikative turns:
- En hilsen, en præsentation af navn eller en enkel social åbning er normalt ikke terapeutisk materiale.
- Når brugeren siger "hej", "jeg hedder..." eller lignende, skal du som udgangspunkt vælge en enkel, jordnær orientering frem for refleksion.
- Når brugeren kommenterer på assistentens stil eller spørger "hvorfor skriver du det?", skal du prioritere klar forklaring eller reparation, ikke psykologisk fortolkning.
- Overfortolk ikke phatic input, small talk eller samtale-reparation.

Definitioner:
- direct_answer: kort, konkret afklaring eller afgrænsning
- guided_observation: hjælp brugeren med at observere noget specifikt
- pattern_detection: hjælp brugeren med at se hvornår noget gentager sig, eller hvornår det ikke gør
- metacognitive_probe: undersøg hvad brugeren tror om egne tanker, reaktioner eller symptomer
- mild_challenge: udfordr en mulig antagelse nænsomt med en alternativ vinkel
- practical_preparation: giv 2-4 konkrete fokuspunkter eller næste forberedende skridt
- synthesis: saml op og gør mønsteret tydeligere uden at åbne for meget mere
- close: luk kort og naturligt

Investigation_focus:
- attention: hvad holder brugeren øje med, og hvad overser de?
- interpretation: hvad betyder oplevelsen for brugeren?
- regulation: hvad gør brugeren automatisk for at håndtere det?
- pattern: hvornår sker det og hvornår ikke?
- preparation: hvad kan brugeren konkret holde øje med eller forberede?
- none: ingen særlig undersøgelsesakse nødvendig

Relational_state skal beskrive, hvordan svaret bedst lander menneskeligt:
- orienting: brugeren orienterer sig og har brug for roligt overblik
- building_clarity: brugeren har brug for afgrænsning, tydelighed eller en enkel struktur
- building_trust: brugeren virker forsigtig, sårbar eller afsøgende og har brug for nøgtern, tryg landing
- decision_support: brugeren er tættere på valg, næste skridt eller vurdering af relevans
- gentle_close: brugeren lukker samtalen venligt ned

Returner kun gyldig JSON efter kontrakten.`

export async function analyzeTurn(params: {
  llm: LlmClient
  transcript: TranscriptTurn[]
  userText: string
  lastTopic?: string
}): Promise<TurnAnalysis | null> {
  const result = await params.llm.chatJson({
    model: process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ANALYSIS_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          transcript: params.transcript,
          user_input: params.userText,
          last_topic: params.lastTopic ?? "",
          contract: {
            intent: [
              "understand_method",
              "ask_evidence",
              "seek_practical_help",
              "explore_pattern",
              "social_closing",
              "unclear",
            ],
            proposed_mode: ["info", "evidence", "practical", "reflection", "closing"],
            conversation_move: [
              "direct_answer",
              "guided_observation",
              "pattern_detection",
              "metacognitive_probe",
              "mild_challenge",
              "practical_preparation",
              "synthesis",
              "close",
            ],
            investigation_focus: ["attention", "interpretation", "regulation", "pattern", "preparation", "none"],
            response_goal: [
              "answer_directly",
              "answer_then_one_question",
              "clarify_minimally",
              "close_briefly",
              "route_to_contact",
            ],
            relational_state: [
              "orienting",
              "building_clarity",
              "building_trust",
              "decision_support",
              "gentle_close",
            ],
            sensitivity: ["low", "medium", "high"],
            confidence_range: [0, 1],
          },
        }),
      },
    ],
  })

  return normalizeTurnAnalysis(result)
}

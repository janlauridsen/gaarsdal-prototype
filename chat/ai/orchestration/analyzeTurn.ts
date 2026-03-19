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

Tænk i vægtet samtalepolitik, ikke i hårde regler.
Du skal vælge den mest menneskeligt hjælpsomme næste bevægelse ud fra styrken i signalerne.

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

Vigtige prioriteringer:
- Når brugeren beskriver et personligt problem, en indre friktion eller at noget er svært at holde ved, skal du ofte vægte reflection højere end generel info.
- Når brugeren både har et mål og en blokering, er det ofte mere hjælpsomt at undersøge mønsteret end at forklare metoden.
- Practical skal kun vinde tydeligt ved kontakt, booking, pris, adresse, telefon, e-mail eller eksplicit næste praktiske skridt.
- Practical må ikke vælges bare fordi brugeren skriver “kan du hjælpe”.
- Info må ikke blive default, hvis brugeren allerede taler om egne barrierer, uro, modstand, træthed, trang eller tilbagefald.
- Evidence skal kun vælges når spørgsmålet reelt handler om dokumentation, effekt eller om det virker.
- Reflection må gerne starte før brugeren eksplicit beder om refleksion, hvis brugerens besked tydeligt handler om egen oplevelse eller et fastlåst mønster.
- Når refleksion vælges, skal den være præcis og samtalebåret, ikke bred eller generisk.
- Hvis de seneste svar sandsynligvis allerede har været forklarende, så vælg gerne en mere personlig og undersøgende bevægelse nu.

Brug gerne en “bridge”-tænkning:
- kort direkte svar først
- derefter et mere personligt fokus

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

Særlige undgåelser:
- gør ikke simple hilsner eller små sociale markører til terapeutisk materiale
- hop ikke til kontaktoplysninger, hvis brugeren stadig udforsker sit problem
- brug ikke generel metodeforklaring som førstevalg, når brugeren allerede beskriver sig selv

Returner kun gyldig JSON efter kontrakten.`

export async function analyzeTurn(params: {
  llm: LlmClient
  transcript: TranscriptTurn[]
  userText: string
  lastTopic?: string
  lastMove?: string
  lastAssistantExcerpt?: string
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
          last_move: params.lastMove ?? "",
          last_assistant_excerpt: params.lastAssistantExcerpt ?? "",
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

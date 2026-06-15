/**
 * runner.ts
 *
 * Ét enkelt implementeringspunkt for alle tre bots (standard, children, alcohol).
 * Tidligere var logikken kopieret i genHypno.ts og genChildren.ts med ~90% overlap.
 *
 * Domæne-specifik adfærd injiceres via DomainConfig.
 */

import { bumpDialogStarted, bumpSafetyEvent, bumpTurn, type UsageBotType } from "../../analytics/usage"
import { computeRollingArousal } from "../orchestration/applyPolicy"
import { buildSingleTurnFallback, singleTurnCall } from "../orchestration/singleTurnCall"
import { AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { detectClientSignals } from "./clientDetection"
import { DomainConfig } from "./domains/types"
import { buildDefaultAnalysis, outputToAnalysis } from "./shared/analysisHelpers"
import { isHardExit } from "./shared/exitDetection"
import { buildMetaDelta } from "./shared/metaDelta"
import { classifySafety, detectFastCrisis, detectFastDependency } from "./shared/safetyClassifier"
import {
  appendTranscript,
  countAssistantTurns,
  lastAssistantExcerpt,
  readStringMeta,
  readTranscriptByKey,
  trimTranscript,
} from "./shared/transcriptHelpers"

export async function runUnifiedCapability(
  context: AiCapabilityContext,
  llm: LlmClient,
  domain: DomainConfig,
): Promise<AiCapabilityResult> {
  const transcript = readTranscriptByKey(context, domain.transcriptKey)
  const trimmedTranscript = trimTranscript(transcript)
  const userText = context.userText ?? ""

  // ─── Brugstælling (GDPR-ren, FØR alle tidlige returns) ───────────────────
  const usageBot: UsageBotType =
    domain.safetyDomain === "alcohol" ? "alcohol" : domain.safetyDomain === "children" ? "children" : "standard"
  const usageAssistantCount = countAssistantTurns(transcript)
  if (usageAssistantCount === 0) {
    await bumpDialogStarted(usageBot)
    // Domæne-specifik side-effect ved dialog-start (fx alkohol-notifikation)
    if (domain.onDialogStart) {
      domain.onDialogStart().catch(() => {})
    }
  }
  await bumpTurn(usageBot)

  const metaPrefix = domain.id // "gen_hypno" | "gen_children" | "gen_alcohol"

  // ─── Topic-håndtering ────────────────────────────────────────────────────
  const storedTopic =
    readStringMeta(context, `${metaPrefix}.last_topic`) || readStringMeta(context, "dialog.topic")
  const isTopicChange =
    storedTopic &&
    trimmedTranscript.length >= 2 &&
    (userText.toLowerCase().includes("ny samtale") ||
      userText.toLowerCase().includes("nyt emne") ||
      userText.toLowerCase().includes("andet emne") ||
      userText.toLowerCase().includes("skifte emne"))
  const previousTopic = isTopicChange ? undefined : storedTopic

  // ─── Hard exit ───────────────────────────────────────────────────────────
  if (isHardExit(userText)) {
    const assistant = "Helt fint. Vi stopper her, og du kan vende tilbage senere."
    const updatedTranscript = appendTranscript(transcript, userText, assistant)
    return {
      transition: {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: domain.exitTarget,
        reason: "user-requested-exit",
        response_message: assistant,
        meta_delta: buildMetaDelta({
          context,
          assistantMessage: assistant,
          updatedTranscript,
          topic: previousTopic,
          sourceNode: domain.sourceNode,
          transcriptKey: domain.transcriptKey,
          userText,
          analysis: buildDefaultAnalysis(userText, previousTopic, "info"),
          mode: "closing",
          relationalState: "gentle_close",
        }),
      },
      debug: { capability: "unified-runner-v1", used_fallback: false },
    }
  }

  // ─── Klientgenkendelse (kun hvor domænet aktiverer det) ──────────────────
  if (domain.clientDetectionNode && context.state.active_node === domain.clientDetectionNode) {
    const clientResult = detectClientSignals(userText, transcript)
    if (clientResult.isClient) {
      const assistant =
        "Hej igen. Hvad er der på hjerte siden sidst — eller er der noget fra sessionen du vil tale nærmere om?"
      const updatedTranscript = appendTranscript(transcript, userText, assistant)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: "CLIENT_SUPPORT",
          reason: `gen-hypno:client-detected (confidence:${clientResult.confidence}, signals:${clientResult.signals.join(",")})`,
          response_message: assistant,
          meta_delta: buildMetaDelta({
            context,
            assistantMessage: assistant,
            updatedTranscript,
            topic: previousTopic,
            sourceNode: domain.sourceNode,
            transcriptKey: domain.transcriptKey,
            userText,
            analysis: buildDefaultAnalysis(userText, previousTopic, "info"),
            mode: "info",
            relationalState: "building_trust",
          }),
        },
        debug: { capability: "unified-runner-v1", used_fallback: false },
      }
    }
  }

  // ─── Window of Tolerance ─────────────────────────────────────────────────
  const previousArousalScore =
    typeof (context.state.meta?.["wot.arousal_score"] as any)?.value === "number"
      ? ((context.state.meta["wot.arousal_score"] as any).value as number)
      : 0
  const arousal = computeRollingArousal(trimmedTranscript, userText, previousArousalScore)

  // ─── Dialog-sekvens kontekst ──────────────────────────────────────────────
  const rawPreviousMode = readStringMeta(context, "dialog.mode") as any
  const rawPreviousRelationalState = readStringMeta(context, "dialog.relational_state") as any
  const rawPreviousDialogStage = readStringMeta(context, "dialog.stage")
  const rawPreviousDialogMove = readStringMeta(context, "dialog.move")

  const isReopeningAfterClose =
    (rawPreviousMode === "closing" ||
      rawPreviousDialogStage === "closing" ||
      rawPreviousDialogMove === "close") &&
    userText.trim().length > 10
  const previousMode = isReopeningAfterClose ? undefined : rawPreviousMode
  const previousRelationalState = isReopeningAfterClose ? undefined : rawPreviousRelationalState

  const assistantCountBefore = countAssistantTurns(transcript)

  // ─── Greeting-hint til history-query ─────────────────────────────────────
  const lastTopicSourceNode = (context.state.meta?.[`${metaPrefix}.last_topic`] as any)?.source_node
  const greetingHint =
    lastTopicSourceNode === "SYSTEM_THREAD_CREATE" && previousTopic
      ? `\n\nNOTE: Brugeren blev budt velkommen med en hilsen der refererede til emnet "${previousTopic}" fra en tidligere samtale. Bekræft dette emne hvis brugeren spørger om historik — svar IKKE at der ingen historik er.`
      : undefined

  // ─── Policy-signaler ──────────────────────────────────────────────────────
  const policySignals = domain.computePolicySignals(userText, trimmedTranscript)

  // ─── Forløb-invitation → BOOKING ─────────────────────────────────────────
  if (domain.stayOnNode === context.state.active_node && policySignals.is_ready_signal) {
    const lastExcerpt = lastAssistantExcerpt(trimmedTranscript)
    const invitationShown =
      lastExcerpt &&
      (lastExcerpt.includes("forløb") ||
        lastExcerpt.includes("tage det videre") ||
        lastExcerpt.includes("høre mere"))
    if (invitationShown) {
      const assistant =
        "Du kan kontakte Jan direkte:\n\n📞 +45 42 80 74 74\n✉️ jan@gaarsdal.net\n📍 Bakkevej 36, 3460 Birkerød\n\nDu kan også sende en besked via kontaktformularen på hjemmesiden.\n\nEn første samtale er uforpligtende — du kan stille spørgsmål og mærke om det giver mening for dig."
      const updatedTranscript = appendTranscript(transcript, userText, assistant)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: "BOOKING",
          reason: "gen-hypno:forloeb-invitation-confirmed",
          response_message: assistant,
          meta_delta: buildMetaDelta({
            context,
            assistantMessage: assistant,
            updatedTranscript,
            topic: previousTopic,
            sourceNode: domain.sourceNode,
            transcriptKey: domain.transcriptKey,
            userText,
            analysis: buildDefaultAnalysis(userText, previousTopic, "practical"),
            mode: "practical",
            relationalState: "decision_support",
          }),
        },
        debug: { capability: "unified-runner-v1", used_fallback: false },
      }
    }
  }

  // ─── Sikkerhedsklassifikation ─────────────────────────────────────────────
  const crisisInMeta = (context.state.meta?.["safety.crisis_detected"] as any)?.value === true
  const fastCrisis = crisisInMeta || detectFastCrisis(userText, domain.safetyDomain)
  const fastDependency = detectFastDependency(userText, domain.safetyDomain)

  const recentContext = trimmedTranscript
    .slice(-4)
    .map((t) => `${t.role}: ${t.content}`)
    .join("\n")
  const safety = await classifySafety(llm, userText, recentContext, fastCrisis, fastDependency, domain.safetyDomain)

  // ─── HARD STOP: Krise ────────────────────────────────────────────────────
  if (safety.crisis) {
    await bumpSafetyEvent(usageBot, "crisis")
    const priorTexts = transcript.filter((t) => t.role === "assistant").map((t) => t.content)
    const alreadyEscalated = priorTexts.some((c) => c.includes("70 201 201"))
    const crisisMessage = alreadyEscalated
      ? "Jeg er her stadig, og du behøver ikke sige mere, end du har lyst til. Men jeg kan ikke bære det her med dig på den måde, du har brug for lige nu — det kan et rigtigt menneske. Livslinjen (70 201 201) lytter uden at dømme, døgnet rundt og gratis. Og er det akut, så ring 112. Du fortjener at have nogen ved din side i det her."
      : "Det lyder som om du har det meget svært lige nu.\n\nDet er vigtigt at du ikke står alene med de tanker. Ring til Livslinjen på 70 201 201 (gratis, døgnet rundt), lægevagten på 1813, eller 112 hvis det er akut."
    const updatedTranscript = appendTranscript(transcript, userText, crisisMessage)
    return {
      transition: {
        type: "NODE_HOP" as const,
        from: context.state.active_node,
        to: context.state.active_node,
        reason: "crisis-detected (hard-stop)",
        response_message: crisisMessage,
        meta_delta: buildMetaDelta({
          context,
          assistantMessage: crisisMessage,
          updatedTranscript,
          topic: previousTopic,
          sourceNode: domain.sourceNode,
          transcriptKey: domain.transcriptKey,
          userText,
          analysis: buildDefaultAnalysis(userText, previousTopic, "info"),
          mode: "info",
          relationalState: "building_trust",
        }),
      },
      debug: { capability: "unified-runner-v1", used_fallback: false },
    }
  }

  // ─── HARD STOP: Fysisk alkohol-afhængighed ───────────────────────────────
  if (safety.dependency) {
    await bumpSafetyEvent(usageBot, "dependency")
    const depMessage =
      "Tak fordi du siger det højt — det er ikke nemt.\n\n" +
      "Når kroppen ryster om morgenen og falder til ro, så snart du drikker, er det et tydeligt tegn på, at den er blevet fysisk afhængig af alkohol. Det er ikke et spørgsmål om viljestyrke — det er kroppens kemi.\n\n" +
      "Det er vigtigt, at du ved, at det at stoppe brat på egen hånd i den tilstand i nogle tilfælde kan være farligt. Det her skal du tage med din egen læge, eller du kan ringe gratis og anonymt til Alkolinjen på 80 200 500.\n\n" +
      "Hypnoterapi kan hjælpe med meget omkring alkohol — men ikke med dette. Her er det kroppen, der skal have lægelig hjælp først."
    const updatedTranscript = appendTranscript(transcript, userText, depMessage)
    return {
      transition: {
        type: "NODE_HOP" as const,
        from: context.state.active_node,
        to: context.state.active_node,
        reason: "alcohol:dependency-detected (hard-stop)",
        response_message: depMessage,
        meta_delta: buildMetaDelta({
          context,
          assistantMessage: depMessage,
          updatedTranscript,
          topic: previousTopic,
          sourceNode: domain.sourceNode,
          transcriptKey: domain.transcriptKey,
          userText,
          analysis: buildDefaultAnalysis(userText, previousTopic, "info"),
          mode: "info",
          relationalState: "building_trust",
        }),
      },
      debug: { capability: "unified-runner-v1", used_fallback: false },
    }
  }

  // ─── LLM-kald ────────────────────────────────────────────────────────────
  // Børne-rollens contextPack: roleOverride præfikses foran brugerens contextPack
  const baseContextPack = context.contextPack?.system ?? ""
  const domainContextPack = domain.roleOverride
    ? domain.roleOverride + (baseContextPack ? "\n\n" + baseContextPack : "")
    : baseContextPack
  const contextPackWithHint = greetingHint ? domainContextPack + greetingHint : domainContextPack

  let turnOutput = await singleTurnCall({
    llm,
    transcript: trimmedTranscript,
    userText,
    lastTopic: isTopicChange ? undefined : previousTopic,
    arousalLevel: arousal.level,
    assistantCount: assistantCountBefore,
    contextPackSystem: contextPackWithHint || undefined,
    userProfileSystem: context.contextPack?.user_profile,
    previousMode,
    previousRelationalState,
    policySignals,
    goalHypothesis: context.contextPack?.goal_hypothesis,
    modelOverride: context.modelOverride,
    rhetoricalInstruction: context.contextPack?.rhetorical_instruction,
    crisisDetected: safety.crisis,
  })

  const usedFallback = !turnOutput
  if (!turnOutput) {
    turnOutput = buildSingleTurnFallback(userText, previousTopic)
  }

  let analysis = outputToAnalysis(turnOutput, previousTopic)

  // ─── Hukommelse-forespørgsel ──────────────────────────────────────────────
  if (turnOutput.is_history_query) {
    const cp = context.contextPack?.system ?? ""
    const hasLtmContext = cp.length > 200
    const sessionTurns = trimmedTranscript.filter((t) => t.role === "assistant").length
    const hasSessionContext = sessionTurns >= 2
    const handoffDone = !!(context.state.meta?.["handoff.last"] as any)?.value

    if (!hasLtmContext && !hasSessionContext) {
      turnOutput = { ...turnOutput, is_history_query: false }
    } else {
      let assistant: string

      if (hasLtmContext) {
        try {
          const raw = await llm.chatJson({
            model: context.modelOverride ?? process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
            temperature: 0.3,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "Du er den digitale assistent for Jan Lauridsen, hypnoterapeut på Gaarsdal. Brugeren spørger hvad du ved om dem ud fra tidligere samtaler.\n\nBrug KUN den kontekst der er givet nedenfor. Svar specifikt på brugerens spørgsmål. Vær konkret og ærlig — si eksplicit hvis noget IKKE er nævnt. Max 3-4 sætninger. Afslut med ét åbent spørgsmål.\n\nSvar KUN med JSON: { \"assistant_message\": \"...\" }\n\nKONTEKST:\n" +
                  cp.slice(0, 2000),
              },
              { role: "user", content: userText },
            ],
          })
          const msg = typeof raw?.assistant_message === "string" ? (raw.assistant_message as string).trim() : null
          assistant =
            msg && msg.length > 10
              ? msg
              : "Jeg kan se du har delt en del om dine vaner og mønstre. Er der noget bestemt du vil have mig til at uddybe?"
        } catch {
          assistant =
            "Jeg kan se du har delt en del om dine vaner og mønstre. Er der noget bestemt du vil have mig til at uddybe?"
        }
      } else {
        const topicStr = previousTopic ? ` om ${previousTopic}` : ""
        const handoffStr = handoffDone ? " Du har også sendt en henvendelse til Jan." : ""
        assistant = `I denne samtale har vi talt${topicStr}.${handoffStr} Jeg husker hvad vi er kommet igennem her, men har endnu ikke adgang til evt. tidligere samtaler.\n\nEr der noget bestemt du vil vende tilbage til?`
      }

      const updatedTranscript = appendTranscript(transcript, userText, assistant)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: context.state.active_node,
          reason: "gen-hypno:history_query",
          response_message: assistant,
          meta_delta: buildMetaDelta({
            context,
            assistantMessage: assistant,
            updatedTranscript,
            topic: previousTopic,
            sourceNode: domain.sourceNode,
            transcriptKey: domain.transcriptKey,
            userText,
            analysis: { ...analysis, proposed_mode: "info", conversation_move: "direct_answer" },
            mode: "info",
            relationalState: "building_clarity",
          }),
        },
        debug: { capability: "unified-runner-v1", used_fallback: false },
      }
    }
  }

  // ─── Normal svar-sti ──────────────────────────────────────────────────────
  const modeUsed = turnOutput.mode_used
  const topic = turnOutput.topic || previousTopic
  const assistant = turnOutput.assistant_message
  const updatedTranscript = appendTranscript(transcript, userText, assistant)

  return {
    transition: {
      type: "NODE_HOP",
      from: context.state.active_node,
      to: domain.stayOnNode,
      reason: `unified-runner:${modeUsed}`,
      response_message: assistant,
      meta_delta: {
        ...buildMetaDelta({
          context,
          assistantMessage: assistant,
          updatedTranscript,
          topic,
          sourceNode: domain.sourceNode,
          transcriptKey: domain.transcriptKey,
          userText,
          analysis,
          mode: modeUsed,
          objective: turnOutput.objective,
          relationalState: analysis.relational_state,
          arousalScore: arousal.score,
          arousalLevel: arousal.level,
        }),
        [`${metaPrefix}.model`]: context.modelOverride ?? process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
      },
    },
    debug: { capability: "unified-runner-v1", used_fallback: usedFallback },
  }
}

export const NODE_LABELS: Record<string, string> = {
  THREAD_CHOOSER: "Samtaler",
  HOME: "Forside",
  GEN_HYPNO: "Spørg om hypnoterapi…",
  BOOKING: "Book tid",
  MAIL: "E-mail",
  TLF: "Telefon",
  CONTACT_FORM: "Kontakt",
  AKUT: "Akut",
}

/**
 * Hvad chatbotten er, hvad der gemmes, og hvem der kan se det.
 * Vises i ChatHeader info-panel og bruges som grundlag for eventuel
 * fuld datapolitik-side.
 *
 * Journal-lag: disse tekster er bevidst formuleret så de åbner for
 * idéen om kontinuitet og personlig hukommelse — uden at love mere
 * end systemet leverer i dag.
 */
export const CHATBOT_DISCLOSURE = {
  /**
   * Klar AI-markering. Brugeren skal aldrig være i tvivl om at det
   * ikke er Jan selv der svarer.
   */
  identity:
    "Dette er en AI-assistent hos Gaarsdal Hypnoterapi — ikke Jan selv. Den er designet til at hjælpe dig tænke klarere om egne mønstre og vaner, og til at afklare om hypnoterapi kan være relevant for dig.",

  /**
   * Dynamisk memory-tekst baseret på brugerens samtykke-valg.
   * retentionDays === 0: session-only, ingen persistens
   * retentionDays > 0: gemmes i X dage
   * undefined/null: standard (bruges som fallback)
   */
  memoryText(retentionDays: number | null | undefined): string {
    if (retentionDays === 0) {
      return "Samtalen gemmes ikke — den forsvinder når du lukker fanen. Ingen data gemmes mellem besøg."
    }
    if (retentionDays === 30) {
      return "Chatbotten husker dine samtaler i 30 dage, så den kan møde dig der, hvor du er — samtale for samtale."
    }
    if (retentionDays === 365) {
      return "Chatbotten husker dine samtaler i 1 år, så den kan møde dig der, hvor du er — samtale for samtale."
    }
    // Default: 90 dage
    return "Chatbotten husker dine samtaler i 90 dage, så den kan møde dig der, hvor du er — samtale for samtale."
  },

  /**
   * Privacy: Jan ser ikke samtaler passivt.
   * Korrigeret: Jan har adgang til systemet men ser ikke individuelle samtaler.
   */
  privacy:
    "Dine samtaler bruges ikke til træning og deles ikke med tredjeparter. Jan ser ikke dine refleksioner — de er dine egne.",
}

/**
 * Nøgler brugt til at spore topic-historik på tværs af samtaler.
 * Bruges i postTurn og LTM-laget til at opbygge den temporale
 * dimension der giver dagbogs-oplevelsen.
 *
 * Tilføjes progressivt fra Sprint 2 og frem.
 */
export const TOPIC_TRACKING_META_KEYS = {
  lastTopic: "gen_hypno.last_topic",
  firstSeenAt: "gen_hypno.topic_first_seen_at",
  lastFraming: "gen_hypno.topic_last_framing",
  topicTags: "gen_hypno.topic_tags",
  assistantTurnCount: "gen_hypno.assistant_turn_count",
} as const

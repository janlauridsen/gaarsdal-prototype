export const NODE_LABELS: Record<string, string> = {
  THREAD_CHOOSER: "Tråde",
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
    "Dette er en AI-chatbot — ikke Jan selv. Den er designet til at hjælpe dig tænke klarere om egne mønstre og vaner, og til at afklare om hypnoterapi kan være relevant for dig.",

  /**
   * Hvad der huskes på tværs af samtaler.
   * "Samtale for samtale" planter frøet til dagbogs-oplevelsen:
   * systemet ved noget om dig over tid, og det er en feature, ikke
   * en ulempe — men det skal siges eksplicit.
   */
  memory:
    "Chatbotten husker dine tidligere samtaler, så den kan møde dig der, hvor du er — samtale for samtale. Dine tråde gemmes i op til 14 dage.",

  /**
   * Privacy: Jan kan ikke passivt overvåge. Kun ved eksplicit samtykke.
   * Dette er det vigtigste tillidssignal i et terapi-nært domæne.
   */
  privacy:
    "Jan kan ikke se dine samtaler uden din udtrykkelige tilladelse. Dine refleksioner er dine egne.",
} as const

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

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
   * Hvad der huskes på tværs af samtaler.
   * Generisk formulering — op til 90 dage er default-maks.
   * Brugerens faktiske periode styres via Privatliv & data i menuen.
   */
  memory:
    "Chatbotten kan huske dine samtaler på tværs af besøg — op til 90 dage som standard. Du styrer selv hvor længe via Privatliv & data i menuen.",

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

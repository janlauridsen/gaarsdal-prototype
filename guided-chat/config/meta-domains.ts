// guided-chat/config/meta-domains.ts

export type MetaPersistence =
  | "session"
  | "task"
  | "global";

export interface MetaDomainConfig {
  domain: string;
  description: string;
  sourceStates: string[];
  persistence: MetaPersistence;
  confidenceImpact: Array<
    "problem_understanding" |
    "state_alignment" |
    "signal_clarity" |
    "stability"
  >;
}

export const META_DOMAINS: MetaDomainConfig[] = [
  {
    domain: "problem_model",
    description: "Systemets forståelse af brugerens problem og kontekst",
    sourceStates: ["start", "select_topic", "ROOT", "TRIAGE"],
    persistence: "global",
    confidenceImpact: ["problem_understanding", "state_alignment"]
  },
  {
    domain: "initial_interest",
    description: "Brugerens første interesse eller indgangsvinkel",
    sourceStates: ["ROOT"],
    persistence: "session",
    confidenceImpact: ["problem_understanding"]
  },
  {
    domain: "triage_result",
    description: "Resultat af afklarende dialog om relevans",
    sourceStates: ["TRIAGE"],
    persistence: "task",
    confidenceImpact: ["problem_understanding", "stability"]
  },
  {
    domain: "initial_intent",
    description: "Brugerens første udtrykte hensigt",
    sourceStates: ["start"],
    persistence: "session",
    confidenceImpact: ["problem_understanding"]
  }
];

export function getMetaDomain(domain: string): MetaDomainConfig | undefined {
  return META_DOMAINS.find(d => d.domain === domain);
}

// guided-chat/config/signal-config.ts

export type SignalClass =
  | "system"
  | "navigation"
  | "task"
  | "choice"
  | "text";

export interface SignalConfig {
  signalType: string;
  signalClass: SignalClass;
  priority: number;
  allowedSources: Array<"ui" | "system">;
  description: string;
}

export const SIGNAL_CONFIG: SignalConfig[] = [
  {
    signalType: "system_internal",
    signalClass: "system",
    priority: 100,
    allowedSources: ["system"],
    description: "Internt enginesignal til kontrol og recovery"
  },

  {
    signalType: "home",
    signalClass: "navigation",
    priority: 90,
    allowedSources: ["ui"],
    description: "Reset til start via home-ikon"
  },
  {
    signalType: "emergency",
    signalClass: "navigation",
    priority: 95,
    allowedSources: ["ui"],
    description: "Akut signal der kan afbryde flow"
  },
  {
    signalType: "contact_phone",
    signalClass: "navigation",
    priority: 80,
    allowedSources: ["ui"],
    description: "Ønske om telefonkontakt"
  },
  {
    signalType: "contact_mail",
    signalClass: "navigation",
    priority: 80,
    allowedSources: ["ui"],
    description: "Ønske om mailkontakt"
  },

  {
    signalType: "create_task",
    signalClass: "task",
    priority: 85,
    allowedSources: ["ui"],
    description: "Opret ny task"
  },
  {
    signalType: "switch_task",
    signalClass: "task",
    priority: 85,
    allowedSources: ["ui"],
    description: "Skift aktiv task"
  },
  {
    signalType: "close_task",
    signalClass: "task",
    priority: 85,
    allowedSources: ["ui"],
    description: "Luk aktiv task"
  },

  {
    signalType: "choice",
    signalClass: "choice",
    priority: 50,
    allowedSources: ["ui"],
    description: "Valg via chip i state"
  },

  {
    signalType: "clarification",
    signalClass: "text",
    priority: 30,
    allowedSources: ["ui"],
    description: "Brugeren beder om afklaring"
  },
  {
    signalType: "correction",
    signalClass: "text",
    priority: 30,
    allowedSources: ["ui"],
    description: "Brugeren korrigerer systemets forståelse"
  },
  {
    signalType: "new_problem",
    signalClass: "text",
    priority: 40,
    allowedSources: ["ui"],
    description: "Brugeren introducerer et nyt problem"
  },
  {
    signalType: "panic",
    signalClass: "text",
    priority: 60,
    allowedSources: ["ui"],
    description: "Stærkt følelses- eller stresssignal"
  },
  {
    signalType: "noise",
    signalClass: "text",
    priority: 10,
    allowedSources: ["ui"],
    description: "Ustruktureret eller irrelevant input"
  }
];

export function getSignalConfig(signalType: string): SignalConfig | undefined {
  return SIGNAL_CONFIG.find(s => s.signalType === signalType);
}

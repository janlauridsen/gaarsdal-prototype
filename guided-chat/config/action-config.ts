// guided-chat/config/action-config.ts

export type ActionScope = "state" | "global" | "task";

export interface ActionConfig {
  actionId: string;
  label: string;
  signalType: string;
  scope: ActionScope;
  uiHint: "chip" | "icon" | "system";
  description: string;
}

export const ACTION_CONFIG: ActionConfig[] = [
  // Global navigation
  {
    actionId: "go_home",
    label: "Start forfra",
    signalType: "home",
    scope: "global",
    uiHint: "icon",
    description: "Reset til start"
  },
  {
    actionId: "emergency",
    label: "Akut hjælp",
    signalType: "emergency",
    scope: "global",
    uiHint: "icon",
    description: "Akut afbrydelse af flow"
  },
  {
    actionId: "contact_phone",
    label: "Ring til os",
    signalType: "contact_phone",
    scope: "global",
    uiHint: "icon",
    description: "Kontakt via telefon"
  },
  {
    actionId: "contact_mail",
    label: "Skriv til os",
    signalType: "contact_mail",
    scope: "global",
    uiHint: "icon",
    description: "Kontakt via mail"
  },

  // Task handling
  {
    actionId: "create_task",
    label: "Ny samtale",
    signalType: "create_task",
    scope: "task",
    uiHint: "system",
    description: "Opret ny task"
  },
  {
    actionId: "switch_task",
    label: "Skift samtale",
    signalType: "switch_task",
    scope: "task",
    uiHint: "system",
    description: "Skift aktiv task"
  },
  {
    actionId: "close_task",
    label: "Luk samtale",
    signalType: "close_task",
    scope: "task",
    uiHint: "system",
    description: "Luk task"
  },

  // State choices (chips)
  {
    actionId: "choice",
    label: "",
    signalType: "choice",
    scope: "state",
    uiHint: "chip",
    description: "State-defineret valg via chip"
  }
];

export function getActionConfig(actionId: string): ActionConfig | undefined {
  return ACTION_CONFIG.find(a => a.actionId === actionId);
}

export function getActionsByScope(scope: ActionScope): ActionConfig[] {
  return ACTION_CONFIG.filter(a => a.scope === scope);
}

import { Chip } from "./chips";

export type NodeId =
  | "ROOT"
  | "CONTACT"
  | "FACTS_HYPNO"
  | "TRIAGE_RELEVANCE";

export interface FlowNode {
  id: NodeId;
  promptFile: string;
  allowedChips: Chip[];
  description: string;
}

export const FLOW_NODES: Record<NodeId, FlowNode> = {
  ROOT: {
    id: "ROOT",
    promptFile: "prompts/root.prompt.md",
    allowedChips: [
      "CONTACT",
      "FACTS_HYPNO",
      "TRIAGE_RELEVANCE",
    ],
    description:
      "Startpunkt. Brugeren skal vælge via chips. Fritekst ignoreres.",
  },

  CONTACT: {
    id: "CONTACT",
    promptFile: "prompts/contact.prompt.md",
    allowedChips: ["BACK_TO_ROOT"],
    description:
      "Ren kontakt- og henvisningsinformation.",
  },

  FACTS_HYPNO: {
    id: "FACTS_HYPNO",
    promptFile: "prompts/facts-hypno.prompt.md",
    allowedChips: ["BACK_TO_ROOT"],
    description:
      "Generel faktuel viden om hypnoterapi.",
  },

  TRIAGE_RELEVANCE: {
    id: "TRIAGE_RELEVANCE",
    promptFile: "prompts/triage.prompt.md",
    allowedChips: ["BACK_TO_ROOT"],
    description:
      "Sandsynlighedsvurdering. Ingen behandling.",
  },
};

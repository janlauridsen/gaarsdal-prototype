// guided-chat/node-router.ts

import { Chip } from "./chips";

export type NodeId =
  | "ROOT"
  | "CONTACT"
  | "FACTS"
  | "TRIAGE"
  | "TRIAGE_DONE"
  | "EXIT";

type RouteTable = {
  [node in NodeId]: Partial<Record<Chip, NodeId>>;
};

export const ROUTES: RouteTable = {
  ROOT: {
    CONTACT: "CONTACT",
    FACTS_HYPNO: "FACTS",
    TRIAGE_RELEVANCE: "TRIAGE",
  },

  CONTACT: {
    BACK_TO_ROOT: "ROOT",
  },

  FACTS: {
    BACK_TO_ROOT: "ROOT",
  },

  TRIAGE: {
    BACK_TO_ROOT: "ROOT",
  },

  TRIAGE_DONE: {
    CONTACT: "CONTACT",
    BACK_TO_ROOT: "ROOT",
  },

  EXIT: {},
};

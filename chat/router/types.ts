/**
 * ROUTER CONTRACT
 * Afleder tilladte transitions ud fra state + node-definition.
 * Ingen side effects. Ingen mutation.
 */

import { NodeId } from "../kernel";

/* =========================
   ROUTER INPUT
========================= */

export type RouterContext = {
  active_node: NodeId;
  stack_depth: number;
};

/* =========================
   ROUTER OUTPUT
========================= */

export type AllowedTransition =
  | {
      type: "NODE_HOP";
      to: NodeId;
    }
  | {
      type: "PARENTESE_OPEN";
      to: NodeId;
    }
  | {
      type: "PARENTESE_CLOSE";
    }
  | {
      type: "TERMINAL";
    };

/**
 * Router returnerer kun muligheder.
 * Ikke valg.
 */
export type RouteResult = {
  allowed: AllowedTransition[];
};

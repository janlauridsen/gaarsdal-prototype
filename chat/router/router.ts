/**
 * PURE ROUTER
 * Deterministisk mapping:
 * (state, node) -> allowed transitions
 */

import { RouterContext, RouteResult } from "./types";
import { nodes } from "../nodes";

/* =========================
   ROUTER
========================= */

export function resolveRoutes(ctx: RouterContext): RouteResult {
  const node = nodes[ctx.active_node];

  if (!node) {
    return { allowed: [] };
  }

  const allowed = [];

  /* --------
     NODE HOPS
  -------- */
  for (const target of node.allowed_transitions ?? []) {
    allowed.push({
      type: "NODE_HOP",
      to: target,
    });
  }

  /* --------
     PARENTESE
  -------- */
  if (node.parens?.can_open) {
    allowed.push({
      type: "PARENTESE_OPEN",
      to: node.parens.target,
    });
  }

  if (node.parens?.can_close && ctx.stack_depth > 0) {
    allowed.push({
      type: "PARENTESE_CLOSE",
    });
  }

  /* --------
     TERMINAL
  -------- */
  if (node.terminal === true) {
    allowed.push({
      type: "TERMINAL",
    });
  }

  return { allowed };
}

/**
 * RMRC Board Registry
 *
 * This file declares all boards known to the RMRC system.
 * It contains data only — no logic, no imports, no side effects.
 */

export type BoardStatus = "active" | "deprecated";

export type BoardType =
  | "reflective"
  | "boundary"
  | "navigation"
  | "meta";

export interface BoardDefinition {
  boardId: string;
  boardType: BoardType;
  allowedRoles: string[];
  purpose: string;
  status: BoardStatus;
}

/**
 * Canonical board registry
 */
export const boards: BoardDefinition[] = [
  {
    boardId: "reflective",
    boardType: "reflective",
    allowedRoles: [
      "mirror",
      "context_holder",
    ],
    purpose:
      "Holding and reflecting the user's experience without explanation, direction, or reduction.",
    status: "active",
  },
  {
    boardId: "boundary",
    boardType: "boundary",
    allowedRoles: [
      "boundary_guardian",
      "authority_diffuser",
    ],
    purpose:
      "Protecting ethical and relational boundaries without interpretation or justification.",
    status: "active",
  },
  {
    boardId: "navigation",
    boardType: "navigation",
    allowedRoles: [
      "dialog_navigator",
    ],
    purpose:
      "Supporting gentle movement in dialogue without directing or prioritizing content.",
    status: "active",
  },
  {
    boardId: "meta",
    boardType: "meta",
    allowedRoles: [],
    purpose:
      "Observing system behavior for logging and analysis without affecting runtime.",
    status: "active",
  },
];

/**
 * RMRC Role Registry
 *
 * This file declares all roles known to the RMRC system.
 * It contains data only — no logic, no imports, no side effects.
 */

export type RoleStatus = "active" | "deprecated";

export interface RoleDefinition {
  roleId: string;
  boardId: string;
  purpose: string;
  status: RoleStatus;
}

/**
 * Canonical role registry
 */
export const roles: RoleDefinition[] = [
  {
    roleId: "mirror",
    boardId: "reflective",
    purpose: "Neutral reflection of the user's expression without interpretation or guidance.",
    status: "active",
  },
  {
    roleId: "context_holder",
    boardId: "reflective",
    purpose: "Holding continuity across turns without structuring, concluding, or elevating meaning.",
    status: "active",
  },
  {
    roleId: "boundary_guardian",
    boardId: "boundary",
    purpose: "Protecting ethical and relational boundaries without explanation or authority.",
    status: "active",
  },
  {
    roleId: "authority_diffuser",
    boardId: "boundary",
    purpose: "Dissolving perceived authority or dependency attributed to the system.",
    status: "active",
  },
  {
    roleId: "dialog_navigator",
    boardId: "navigation",
    purpose: "Offering light invitations for movement without directing or prioritizing.",
    status: "active",
  },
];

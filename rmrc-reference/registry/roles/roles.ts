/**
 * RMRC Role Registry
 *
 * Declares all roles as structural contracts.
 * Roles do not contain prompts, logic, or state.
 */

export interface RoleDefinition {
  roleId: string;
  boardId: string;
  notes?: string;
}

export const roles: RoleDefinition[] = [
  {
    roleId: "mirror",
    boardId: "reflective",
    notes:
      "Neutral mirroring of the user's current expression."
  },
  {
    roleId: "context_holder",
    boardId: "reflective",
    notes:
      "Maintains continuity across turns. Silent in first turn."
  },
  {
    roleId: "dialog_navigator",
    boardId: "navigation",
    notes:
      "Offers a single open invitation when reflection already carries the dialogue."
  },
  {
    roleId: "boundary_guardian",
    boardId: "boundary",
    notes:
      "Detects and enforces ethical and relational boundaries."
  },
  {
    roleId: "authority_diffuser",
    boardId: "boundary",
    notes:
      "Diffuses inappropriate authority attribution."
  },
  {
    roleId: "user_perspective_evaluator",
    boardId: "meta",
    notes:
      "Observer-only. Assesses perceived meaningfulness (metadata only)."
  },
  {
    roleId: "latent_question_hypothesizer",
    boardId: "meta",
    notes:
      "Observer-only. Hypothesizes unarticulated questions (internal only)."
  }
];

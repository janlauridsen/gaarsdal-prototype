/**
 * RMRC Board Registry
 *
 * Declares all boards and which roles are allowed
 * to participate in each board.
 *
 * Structural only — no logic.
 */

export interface BoardDefinition {
  boardId: string;
  allowedRoles: string[];
  notes?: string;
}

export const boards: BoardDefinition[] = [
  {
    boardId: "reflective",
    allowedRoles: [
      "mirror",
      "context_holder"
    ],
    notes:
      "Core reflective board. Holds and mirrors user experience without direction."
  },
  {
    boardId: "boundary",
    allowedRoles: [
      "boundary_guardian",
      "authority_diffuser"
    ],
    notes:
      "Protects ethical and relational boundaries."
  },
  {
    boardId: "navigation",
    allowedRoles: [
      "dialog_navigator"
    ],
    notes:
      "Optional board for rare, open invitations when reflection already carries the dialogue."
  },
  {
    boardId: "meta",
    allowedRoles: [
      "user_perspective_evaluator",
      "latent_question_hypothesizer"
    ],
    notes:
      "Observer-only board. Read-only. No runtime influence."
  }
];

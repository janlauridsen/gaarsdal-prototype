/**
 * RMRC Prompt Registry (Metadata)
 *
 * This file declares all prompts known to the RMRC system.
 * It contains metadata only — no prompt text, no logic.
 */

export type PromptStatus = "active" | "archived";

export interface PromptDefinition {
  promptId: string;
  roleId: string;
  version: string;
  intent: string;
  status: PromptStatus;
}

/**
 * Canonical prompt registry (metadata only)
 */
export const prompts: PromptDefinition[] = [
  {
    promptId: "mirror_v1",
    roleId: "mirror",
    version: "1.0.0",
    intent: "Neutral reflective mirroring of the user's expression without interpretation or guidance.",
    status: "active",
  },
  {
    promptId: "context_holder_v1",
    roleId: "context_holder",
    version: "1.0.0",
    intent: "Holding conversational continuity without summarizing, prioritizing, or concluding.",
    status: "active",
  },
  {
    promptId: "boundary_guardian_v1",
    roleId: "boundary_guardian",
    version: "1.0.0",
    intent: "Emitting neutral boundary statements when ethical or relational limits are approached.",
    status: "active",
  },
  {
    promptId: "authority_diffuser_v1",
    roleId: "authority_diffuser",
    version: "1.0.0",
    intent: "Dissolving perceived authority or dependency attributed to the system.",
    status: "active",
  },
  {
    promptId: "dialog_navigator_v1",
    roleId: "dialog_navigator",
    version: "1.0.0",
    intent: "Offering a single, open invitation for movement without directing the dialogue.",
    status: "active",
  },
];

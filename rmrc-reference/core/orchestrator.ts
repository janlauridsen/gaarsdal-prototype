import { boards } from "../registry/boards/boards";
import { runtimeProfiles } from "../registry/runtime-profiles/profiles";
import { Logger } from "../logs/logger";
import { invokeAI } from "./aiInvoke";
import { loadPrompt } from "../registry/prompts/loadPrompt";
import { shouldTriggerBoundary } from "./boundaryTrigger";
import { shouldDiffuseAuthority } from "./authorityTrigger";

export class Orchestrator {
  constructor(private logger: Logger) {}

  async runTurn(
    profileId: string,
    userInput: string | null
  ): Promise<string | null> {
    const profile = runtimeProfiles.find(
      (p) => p.profileId === profileId
    );

    if (!profile) {
      throw new Error(`Unknown runtime profile: ${profileId}`);
    }

    this.logger.log("turn_started", { profileId });

    const outputs: string[] = [];

    for (const boardId of profile.enabledBoards) {
      const board = boards.find((b) => b.boardId === boardId);
      if (!board) continue;

      this.logger.log("board_activated", { boardId });

      const activeRoles = board.allowedRoles.filter((roleId) =>
        profile.enabledRoles.includes(roleId)
      );

      // --- Boundary & Authority triggers evaluated once per turn ---
      const boundaryTriggered =
        userInput !== null && shouldTriggerBoundary(userInput);

      const authorityTriggered =
        userInput !== null && shouldDiffuseAuthority(userInput);

      for (const roleId of activeRoles) {
        this.logger.log("role_invoked", { roleId });

        if (!userInput) continue;

        // --- Reflective roles (always allowed) ---

        if (roleId === "mirror") {
          const prompt = loadPrompt("mirror_v1");
          const result = await invokeAI({ prompt, userInput });
          if (result.output) outputs.push(result.output);
        }

        if (roleId === "context_holder") {
          const prompt = loadPrompt("context_holder_v1");
          const result = await invokeAI({ prompt, userInput });
          if (result.output) outputs.push(result.output);
        }

        // --- Boundary Guardian has priority ---

        if (
          roleId === "boundary_guardian" &&
          boundaryTriggered
        ) {
          const prompt = loadPrompt("boundary_guardian_v1");
          const result = await invokeAI({ prompt, userInput });
          if (result.output) outputs.push(result.output);

          // IMPORTANT:
          // If boundary is triggered, authority diffusion
          // must NOT happen in the same turn.
          continue;
        }

        // --- Authority Diffuser only if no boundary ---

        if (
          roleId === "authority_diffuser" &&
          authorityTriggered &&
          !boundaryTriggered
        ) {
          const prompt = loadPrompt("authority_diffuser_v1");
          const result = await invokeAI({ prompt, userInput });
          if (result.output) outputs.push(result.output);
        }
      }
    }

    if (outputs.length === 0) {
      this.logger.log("silence_emitted");
      return null;
    }

    this.logger.log("output_emitted");
    return outputs.join("\n");
  }
}

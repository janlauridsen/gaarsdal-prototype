import { boards } from "../registry/boards/boards";
import { runtimeProfiles } from "../registry/runtime-profiles/profiles";
import { Logger } from "../logs/logger";
import { invokeAI } from "./aiInvoke";
import { loadPrompt } from "../registry/prompts/loadPrompt";
import { shouldTriggerBoundary } from "./boundaryTrigger";
import { shouldDiffuseAuthority } from "./authorityTrigger";

export class Orchestrator {
  constructor(private readonly logger: Logger) {}

  async runTurn(
    profileId: string,
    userInput: string | null,
    turnIndex: number
  ): Promise<string | null> {
    const profile = runtimeProfiles.find(
      (p) => p.profileId === profileId
    );

    if (!profile) {
      throw new Error(`Unknown runtime profile: ${profileId}`);
    }

    const outputs: string[] = [];

    for (const boardId of profile.enabledBoards) {
      const board = boards.find((b) => b.boardId === boardId);
      if (!board) continue;

      this.logger.log("board_activated", { boardId });

      const activeRoles = board.allowedRoles.filter((roleId) =>
        profile.enabledRoles.includes(roleId)
      );

      const boundaryTriggered =
        userInput !== null && shouldTriggerBoundary(userInput);

      const authorityTriggered =
        userInput !== null && shouldDiffuseAuthority(userInput);

      for (const roleId of activeRoles) {
        // Context holder is silent on first turn
        if (roleId === "context_holder" && turnIndex < 2) {
          this.logger.log("role_skipped", {
            roleId,
            reason: "no_context_yet",
            turnIndex,
          });
          continue;
        }

        this.logger.log("role_invoked", { roleId });

        if (!userInput) continue;

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

        if (roleId === "boundary_guardian" && boundaryTriggered) {
          const prompt = loadPrompt("boundary_guardian_v1");
          const result = await invokeAI({ prompt, userInput });
          if (result.output) outputs.push(result.output);
          continue;
        }

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

    const finalOutput = outputs[0];

    this.logger.log("output_consolidated", {
      strategy: "first_non_empty",
      candidates: outputs.length,
    });

    return finalOutput;
  }
}

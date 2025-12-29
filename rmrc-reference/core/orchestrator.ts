import { boards } from "../registry/boards/boards";
import { runtimeProfiles } from "../registry/runtime-profiles/profiles";
import { Logger } from "../logs/logger";
import { invokeAI } from "./aiInvoke";
import { loadPrompt } from "../registry/prompts/loadPrompt";

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

      for (const roleId of activeRoles) {
        this.logger.log("role_invoked", { roleId });

        // Only Mirror is active with AI in this iteration
        if (roleId === "mirror" && userInput) {
          const prompt = loadPrompt("mirror_v1");

          const result = await invokeAI({
            prompt,
            userInput,
          });

          if (result.output) {
            outputs.push(result.output);
          }
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

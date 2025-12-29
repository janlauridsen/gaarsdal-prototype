import { boards } from "../registry/boards/boards";
import { runtimeProfiles } from "../registry/runtime-profiles/profiles";
import { Logger } from "../logs/logger";
import { invokeAI } from "./aiInvoke";
import { loadPrompt } from "../registry/prompts/loadPrompt";

export class Orchestrator {
  constructor(private logger: Logger) {}

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

    this.logger.log("turn_started", { profileId, turnIndex });

    const outputs: string[] = [];

    for (const boardId of profile.enabledBoards) {
      const board = boards.find((b) => b.boardId === boardId);
      if (!board) continue;

      this.logger.log("board_activated", { boardId });

      const activeRoles = board.allowedRoles.filter((roleId) =>
        profile.enabledRoles.includes(roleId)
      );

      for (const roleId of activeRoles) {
        // DOC 5: Context Holder is silent in first turn
        if (roleId === "context_holder" && turnIndex < 2) {
          this.logger.log("role_skipped", {
            roleId,
            reason: "no_context_yet",
            turnIndex,
          });
          continue;
        }

        // DOC 5: Dialog Navigator never runs in turn 1
        if (roleId === "dialog_navigator" && turnIndex < 2) {
          this.logger.log("role_skipped", {
            roleId,
            reason: "navigation_not_allowed_in_turn_1",
            turnIndex,
          });
          continue;
        }

        
      this.logger.log("role_invoked", {
        roleId,
        boardId,
        turnIndex,
      });

        if (!userInput) continue;

        const promptId = `${roleId}_v1`;
        const prompt = loadPrompt(promptId);

        const result = await invokeAI({
          prompt,
          userInput,
        });

        if (result?.output) {
          outputs.push(result.output);
        }
      }
    }

    if (outputs.length === 0) {
      this.logger.log("silence_emitted");
      return null;
    }

    this.logger.log("output_emitted", {
      roleCount: outputs.length,
    });

    // DOC 5: No semantic prioritization
    return outputs.join("\n");
  }
}

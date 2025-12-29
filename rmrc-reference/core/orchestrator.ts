import { boards } from "../registry/boards/boards";
import { roles } from "../registry/roles/roles";
import { runtimeProfiles } from "../registry/runtime-profiles/profiles";
import { Logger } from "../logs/logger";

export class Orchestrator {
  constructor(private logger: Logger) {}

  runTurn(
    profileId: string,
    userInput: string | null
  ): string | null {
    const profile = runtimeProfiles.find(p => p.profileId === profileId);
    if (!profile) {
      throw new Error(`Unknown runtime profile: ${profileId}`);
    }

    this.logger.log("turn_started", { profileId });

    const outputs: string[] = [];

    for (const boardId of profile.enabledBoards) {
      const board = boards.find(b => b.boardId === boardId);
      if (!board) continue;

      this.logger.log("board_activated", { boardId });

      const activeRoles = board.allowedRoles.filter(roleId =>
        profile.enabledRoles.includes(roleId)
      );

      for (const roleId of activeRoles) {
        this.logger.log("role_invoked", { roleId });

        // Placeholder – no AI yet
        // Later: lookup prompt + invoke AI
        const output = null;

        if (output) {
          outputs.push(output);
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

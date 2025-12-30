import { Orchestrator } from "../core/orchestrator";
import { Logger } from "../logs/logger";

export class Session {
  private turnIndex = 0;
  private ended = false;

  constructor(
    private readonly profileId: string,
    private readonly orchestrator: Orchestrator,
    private readonly logger: Logger
  ) {
    this.logger.log("session_started", {
      profileId: this.profileId,
    });
  }

  async handleInput(input: string | null): Promise<string | null> {
    if (this.ended) {
      throw new Error("Session already ended");
    }

    this.turnIndex++;

    this.logger.log("turn_started", {
      turnIndex: this.turnIndex,
      hasInput: input !== null,
    });

    const output = await this.orchestrator.runTurn(
      this.profileId,
      input,
      this.turnIndex
    );

    this.logger.log("turn_completed", {
      turnIndex: this.turnIndex,
      hasOutput: output !== null,
    });

    return output;
  }

  end(): void {
    if (this.ended) return;

    this.ended = true;
    this.logger.log("session_ended", {
      totalTurns: this.turnIndex,
    });
  }
}

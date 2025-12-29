import { Logger } from "../logs/logger";
import { Orchestrator } from "../core/orchestrator";

export class Session {
  private turnIndex = 0;

  constructor(
    private profileId: string,
    private orchestrator: Orchestrator,
    private logger: Logger
  ) {
    this.logger.log("session_started", { profileId });
  }

  handleInput(input: string | null): string | null {
    this.turnIndex++;
    this.logger.log("turn_index", { turnIndex: this.turnIndex });

    return this.orchestrator.runTurn(this.profileId, input);
  }

  end() {
    this.logger.log("session_ended");
  }
}

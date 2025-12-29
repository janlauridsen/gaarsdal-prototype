import { Logger } from "../logs/logger";
import { Orchestrator } from "../core/orchestrator";
import { Session } from "./session";

async function run() {
  const logger = new Logger();
  const orchestrator = new Orchestrator(logger);

  const session = new Session(
    "reflective_minimal",
    orchestrator,
    logger
  );

  const output = await session.handleInput(
    "Jeg føler mig lidt fastlåst for tiden"
  );

  console.log("OUTPUT:");
  console.log(output);

  console.log("\nLOGS:");
  console.log(logger.getEvents());
}

run();

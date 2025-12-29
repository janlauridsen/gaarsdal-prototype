import { Logger } from "../logs/logger";
import { Orchestrator } from "../core/orchestrator";
import { Session } from "./session";

const logger = new Logger();
const orchestrator = new Orchestrator(logger);

const session = new Session(
  "reflective_minimal",
  orchestrator,
  logger
);

// Simulated input
const output = session.handleInput("I feel stuck lately");

console.log("OUTPUT:", output);
console.log("LOGS:", logger.getEvents());

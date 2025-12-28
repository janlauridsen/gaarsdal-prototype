// lib/runtime/runSessionTurn.ts

import { createLogEvent } from "../logging/createLogEvent";
import { writeLogEvent } from "../logging/writeLogEvent";
import { getNextTurn } from "../logging/getNextTurn";
import { runtimeConfig } from "./runtimeConfig";
import { runRoleStub } from "./runRoleStub";

export async function runSessionTurn(params: {
  sessionId: string;
  userText: string;
}) {
  const { sessionId, userText } = params;

  const turn = await getNextTurn(sessionId);

  // user_input
  await writeLogEvent(
    createLogEvent({
      sessionId,
      layer: "session",
      eventType: "user_input",
      turn,
      payload: { text: userText },
    })
  );

  // role executions (stub)
  for (const role of runtimeConfig.activeRoles) {
    const output = runRoleStub(role, userText);

    await writeLogEvent(
      createLogEvent({
        sessionId,
        layer: "session",
        eventType: "role_execution",
        turn,
        role,
        payload: {
          output,
        },
      })
    );
  }

  // assistant_output (stub consolidation)
  await writeLogEvent(
    createLogEvent({
      sessionId,
      layer: "session",
      eventType: "assistant_output",
      turn,
      payload: {
        text: "[stub response]",
      },
    })
  );
}

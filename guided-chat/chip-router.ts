// guided-chat/chip-router.ts

import { createSignal } from "./signals";
import { getActionConfig } from "./config/action-config";

export function routeChipAction(
  actionId: string,
  payload?: unknown
) {
  const action = getActionConfig(actionId);

  if (!action) {
    throw new Error(`Unknown actionId: ${actionId}`);
  }

  if (action.scope !== "state") {
    throw new Error(
      `Action '${actionId}' is not allowed in state scope`
    );
  }

  return createSignal(
    action.signalType,
    payload,
    "ui"
  );
}

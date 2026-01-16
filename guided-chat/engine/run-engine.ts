// guided-chat/engine/run-engine.ts

import { Signal } from "../signals";
import { SessionState } from "../session/session.types";
import { handleTaskSignal } from "./task-handlers";
import { nodes } from "../nodes";
import { GLOBAL_STATES } from "../config/global-states";

function renderGlobalState(stateData: any) {
  return {
    type: "global_state",
    state: stateData.id,
    message: stateData.ui_projection.text,
    actions: stateData.allowed_actions.map((a: string) => ({
      actionId: a,
      label: a
    }))
  };
}

export function runEngine(
  signal: Signal,
  session: SessionState
) {
  // 1) Globale intents
  switch (signal.type) {
    case "home":
      return renderGlobalState(GLOBAL_STATES.HOME);

    case "contact_phone":
      return renderGlobalState(GLOBAL_STATES.CONTACT_PHONE);

    case "contact_mail":
      return renderGlobalState(GLOBAL_STATES.CONTACT_MAIL);

    case "emergency":
      return renderGlobalState(GLOBAL_STATES.EMERGENCY);
  }

  // 2) Task-signaler
  const handled = handleTaskSignal(signal.type, session);
  if (handled) {
    return {
      type: "task_update",
      activeTaskId: session.activeTaskId,
      taskIds: Object.keys(session.tasks)
    };
  }

  // 3) Almindelig state-machine for aktiv task
  const task = session.tasks[session.activeTaskId];
  if (!task) {
    throw new Error("Active task not found");
  }

  const node = nodes[task.currentState];
  if (!node) {
    throw new Error(`Unknown state: ${task.currentState}`);
  }

  node.onSignal(signal, task);
  const rendered = node.render();

  return {
    type: "state",
    taskId: task.taskId,
    state: task.currentState,
    message: rendered.text,
    actions: rendered.chips
  };
}

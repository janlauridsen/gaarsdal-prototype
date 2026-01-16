// guided-chat/engine/run-engine.ts

import { Signal } from "../signals";
import { SessionState } from "../session/session.types";
import { handleTaskSignal } from "./task-handlers";
import { nodes } from "../nodes";

export function runEngine(
  signal: Signal,
  session: SessionState
) {
  // 1) Task-signaler har absolut prioritet
  const handled = handleTaskSignal(signal.type, session);
  if (handled) {
    return {
      type: "task_update",
      activeTaskId: session.activeTaskId,
      taskIds: Object.keys(session.tasks)
    };
  }

  // 2) Almindelig state-machine for aktiv task
  const task = session.tasks[session.activeTaskId];
  if (!task) {
    throw new Error("Active task not found");
  }

  const node = nodes[task.currentState];
  if (!node) {
    throw new Error(`Unknown state: ${task.currentState}`);
  }

  // eksisterende state-logik (uændret)
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

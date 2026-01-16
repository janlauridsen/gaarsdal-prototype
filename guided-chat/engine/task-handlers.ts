// guided-chat/engine/task-handlers.ts

import { SessionState, TaskState } from "../session/session.types";
import { TASK_TYPES } from "../config/task-types";

function createTask(taskType: string): TaskState {
  const cfg = TASK_TYPES.find(t => t.taskType === taskType);
  if (!cfg) {
    throw new Error(`Unknown task type: ${taskType}`);
  }

  return {
    taskId: crypto.randomUUID(),
    taskType: cfg.taskType,
    currentState: cfg.initialState,
    meta: {}
  };
}

export function handleTaskSignal(
  signalType: string,
  session: SessionState
): boolean {
  switch (signalType) {
    case "create_task": {
      const task = createTask("guided_chat");
      session.tasks[task.taskId] = task;
      session.activeTaskId = task.taskId;
      return true;
    }

    case "switch_task": {
      const ids = Object.keys(session.tasks);
      if (ids.length <= 1) return true;

      const index = ids.indexOf(session.activeTaskId);
      const next = ids[(index + 1) % ids.length];
      session.activeTaskId = next;
      return true;
    }

    case "close_task": {
      const ids = Object.keys(session.tasks);
      if (ids.length <= 1) return true;

      delete session.tasks[session.activeTaskId];
      session.activeTaskId = Object.keys(session.tasks)[0];
      return true;
    }

    default:
      return false;
  }
}

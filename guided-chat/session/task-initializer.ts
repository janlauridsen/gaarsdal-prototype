// guided-chat/session/task-initializer.ts

import { SessionState, TaskState } from "./session.types";
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

export function createInitialSessionState(): SessionState {
  const initialTask = createTask("guided_chat");

  return {
    activeTaskId: initialTask.taskId,
    tasks: {
      [initialTask.taskId]: initialTask
    },
    confidence: {
      problem_understanding: 0.5,
      state_alignment: 0.7,
      signal_clarity: 0.6,
      stability: 0.8
    }
  };
}

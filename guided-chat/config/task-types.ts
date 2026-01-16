// guided-chat/config/task-types.ts

export interface TaskTypeConfig {
  taskType: string;
  entrySignalTypes: string[];
  initialState: string;
  terminalStates: string[];
  persistence: "session" | "global";
  description: string;
}

export const TASK_TYPES: TaskTypeConfig[] = [
  {
    taskType: "guided_chat",
    entrySignalTypes: [
      "home",
      "create_task"
    ],
    initialState: "ROOT",
    terminalStates: [],
    persistence: "session",
    description: "Standard guidet samtale med state-machine"
  }
];

export function getTaskType(taskType: string): TaskTypeConfig | undefined {
  return TASK_TYPES.find(t => t.taskType === taskType);
}

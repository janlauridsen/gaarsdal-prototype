export interface LogEvent {
  type: string;
  timestamp: number;
  data?: Record<string, any>;
}

export interface RoleActivity {
  roleId: string;
  status: "invoked" | "skipped";
  reason?: string;
}

export interface TurnSummary {
  turnIndex: number;
  boards: string[];
  roles: RoleActivity[];
  outputsEmitted: boolean;
}

export interface LogEvent {
  type: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export class Logger {
  private events: LogEvent[] = [];

  log(type: string, data?: Record<string, unknown>) {
    this.events.push({
      type,
      timestamp: Date.now(),
      data,
    });
  }

  getEvents(): LogEvent[] {
    return this.events;
  }
}

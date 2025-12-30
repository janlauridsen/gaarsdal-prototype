import { PostProcessingEvent } from "./postProcessing.types";

export class PostProcessingLogger {
  private events: PostProcessingEvent[] = [];

  log(event: PostProcessingEvent) {
    this.events.push(event);
  }

  getEvents(): PostProcessingEvent[] {
    return this.events;
  }
}

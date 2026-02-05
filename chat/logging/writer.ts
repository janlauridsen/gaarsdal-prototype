import { LogEvent } from './types'

export type LogWriter = (entry: LogEvent) => void

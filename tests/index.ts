import tc01 from "./cases/tc-01-intro.json"
import tc02 from "./cases/tc-02-booking.json"
import tc03 from "./cases/tc-03-no-handoff-on-problem-description.json"
import tc04 from "./cases/tc-04-persona.json"
import tc05 from "./cases/tc-05-offtopic.json"

export interface TestCase {
  id: string
  description: string
  tags: string[]
  maxTurns: number
  driverRole: string
  driverGoal: string
  exitCondition: string
  passCriteria: string[]
}

export const ALL_TEST_CASES: TestCase[] = [
  tc01 as TestCase,
  tc02 as TestCase,
  tc03 as TestCase,
  tc04 as TestCase,
  tc05 as TestCase,
]

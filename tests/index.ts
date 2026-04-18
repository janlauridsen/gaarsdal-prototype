import tc01 from "./cases/tc-01-intro.json"
import tc02 from "./cases/tc-02-booking.json"
import tc03 from "./cases/tc-03-no-handoff-on-problem-description.json"
import tc04 from "./cases/tc-04-persona.json"
import tc05 from "./cases/tc-05-offtopic.json"
import tc06 from "./cases/tc-06-safety-crisis.json"
import tc07 from "./cases/tc-07-skeptic.json"
import tc08 from "./cases/tc-08-returning-client.json"
import tc09 from "./cases/tc-09-long-session.json"
import tc10 from "./cases/tc-10-no-handoff-false-positive.json"
import tc11 from "./cases/tc-11-price-question.json"
import tc12 from "./cases/tc-12-minimal-input.json"
import tc13 from "./cases/tc-13-consent-session-only.json"
import tc14 from "./cases/tc-14-angst.json"
import tc15 from "./cases/tc-15-sovn.json"
import tc16 from "./cases/tc-16-stress.json"
import tc17 from "./cases/tc-17-rygestop.json"
import tc18 from "./cases/tc-18-overspisning.json"
import tc19 from "./cases/tc-19-indre-kritiker.json"
import tc20 from "./cases/tc-20-praestationsangst.json"
import tc21 from "./cases/tc-21-alkohol.json"
import tc22 from "./cases/tc-22-flyskraek.json"
import tc23 from "./cases/tc-23-bekymringer.json"
import tc24 from "./cases/tc-24-reflektion-livsmoenster.json"
import tc25 from "./cases/tc-25-reflektion-relationer.json"
import tc26 from "./cases/tc-26-reflektion-stilstand.json"
import tc27 from "./cases/tc-27-reflektion-udholdenhed.json"
import tc28 from "./cases/tc-28-hypnoterapi-afvist.json"
import tc29 from "./cases/tc-29-false-positive-booking-ja.json"
import tc30 from "./cases/tc-30-somatisk-sprog.json"
import tc31 from "./cases/tc-31-emne-shift.json"
import tc32 from "./cases/tc-32-klient-signal.json"

export interface TestCase {
  id: string
  description: string
  tags: string[]
  maxTurns: number
  driverRole: string
  driverGoal: string
  exitCondition: string
  passCriteria: string[]
  skipRubric?: boolean
  customRubricCriteria?: string[]
}

export const ALL_TEST_CASES: TestCase[] = [
  tc01 as TestCase, tc02 as TestCase, tc03 as TestCase, tc04 as TestCase,
  tc05 as TestCase, tc06 as TestCase, tc07 as TestCase, tc08 as TestCase,
  tc09 as TestCase, tc10 as TestCase, tc11 as TestCase, tc12 as TestCase,
  tc13 as TestCase, tc14 as TestCase, tc15 as TestCase, tc16 as TestCase,
  tc17 as TestCase, tc18 as TestCase, tc19 as TestCase, tc20 as TestCase,
  tc21 as TestCase, tc22 as TestCase, tc23 as TestCase, tc24 as TestCase,
  tc25 as TestCase, tc26 as TestCase, tc27 as TestCase, tc28 as TestCase,
  tc29 as TestCase, tc30 as TestCase, tc31 as TestCase, tc32 as TestCase,
]

import ch01 from "./cases/ch-01-spaedbarn-under-8.json"
import ch02 from "./cases/ch-02-alder-formuleret-indirekte.json"
import ch03 from "./cases/ch-03-sarkasme.json"
import ch04 from "./cases/ch-04-humor-absurd.json"
import ch05 from "./cases/ch-05-seksuel-antydning-jan.json"
import ch06 from "./cases/ch-06-bekymrende-barn-og-voksne.json"
import ch07 from "./cases/ch-07-overgreb-direkte.json"
import ch08 from "./cases/ch-08-diskrimination.json"
import ch09 from "./cases/ch-09-prompt-injection.json"
import ch10 from "./cases/ch-10-juridisk-spoergsmaal.json"
import ch11 from "./cases/ch-11-ung-skriver-om-ven.json"
import ch12 from "./cases/ch-12-meningsloes-input.json"

export interface ChildrenTestCase {
  id: string
  description: string
  tags: string[]
  maxTurns: number
  driverRole: string
  driverGoal: string
  exitCondition: string
  passCriteria: string[]
}

export const ALL_CHILDREN_TEST_CASES: ChildrenTestCase[] = [
  ch01 as ChildrenTestCase,
  ch02 as ChildrenTestCase,
  ch03 as ChildrenTestCase,
  ch04 as ChildrenTestCase,
  ch05 as ChildrenTestCase,
  ch06 as ChildrenTestCase,
  ch07 as ChildrenTestCase,
  ch08 as ChildrenTestCase,
  ch09 as ChildrenTestCase,
  ch10 as ChildrenTestCase,
  ch11 as ChildrenTestCase,
  ch12 as ChildrenTestCase,
]

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
  chatbotType: "children"
}

function asChildren(c: unknown): ChildrenTestCase {
  return { ...(c as ChildrenTestCase), chatbotType: "children" }
}

export const ALL_CHILDREN_TEST_CASES: ChildrenTestCase[] = [
  asChildren(ch01), asChildren(ch02), asChildren(ch03),
  asChildren(ch04), asChildren(ch05), asChildren(ch06),
  asChildren(ch07), asChildren(ch08), asChildren(ch09),
  asChildren(ch10), asChildren(ch11), asChildren(ch12),
]

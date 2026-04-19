import tc_ttm01 from "./cases/ttm-01-rutine-forandring.json"
import tc_ttm02 from "./cases/ttm-02-relation-partner.json"
import tc_ttm03 from "./cases/ttm-03-kort-input.json"
import tc_ttm04 from "./cases/ttm-04-ingen-spgsml-dominans.json"
import tc_ttm05 from "./cases/ttm-05-krise-redirect.json"

export interface TtmTestCase {
  id: string
  description: string
  tags: string[]
  maxTurns: number
  driverRole: string
  driverGoal: string
  exitCondition: string
  passCriteria: string[]
  moveCriteria?: string[]
}

export const ALL_TTM_TEST_CASES: TtmTestCase[] = [
  tc_ttm01 as TtmTestCase,
  tc_ttm02 as TtmTestCase,
  tc_ttm03 as TtmTestCase,
  tc_ttm04 as TtmTestCase,
  tc_ttm05 as TtmTestCase,
]

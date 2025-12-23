export function violatesStopRule(
  hasClosedBefore: boolean,
  isClosingNow: boolean
): boolean {
  return hasClosedBefore && !isClosingNow;
}

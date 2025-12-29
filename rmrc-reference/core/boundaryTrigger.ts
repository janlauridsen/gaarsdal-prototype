/**
 * Boundary trigger detection
 *
 * This is intentionally conservative.
 * It only reacts to explicit authority or dependency signals.
 */

const AUTHORITY_PATTERNS = [
  "du kan",
  "du ved",
  "du må",
  "du bør",
  "hvad skal jeg gøre",
  "hjælp mig med at beslutte",
  "kan du fortælle mig",
];

export function shouldTriggerBoundary(
  userInput: string
): boolean {
  const lower = userInput.toLowerCase();

  return AUTHORITY_PATTERNS.some((pattern) =>
    lower.includes(pattern)
  );
}

/**
 * Authority / dependency trigger detection
 *
 * This trigger detects when the user places authority,
 * expertise, or responsibility on the system.
 *
 * It is intentionally conservative and explicit.
 */

const DEPENDENCY_PATTERNS = [
  "du ved bedst",
  "du forstår mig",
  "kun du kan",
  "jeg har brug for dig",
  "jeg stoler på dig",
  "hvad mener du jeg skal",
  "fortæl mig hvad jeg skal",
];

export function shouldDiffuseAuthority(
  userInput: string
): boolean {
  const lower = userInput.toLowerCase();

  return DEPENDENCY_PATTERNS.some((pattern) =>
    lower.includes(pattern)
  );
}

export function detectClosure(text: string): boolean {
  return text
    .trim()
    .startsWith("Ud fra det, du har beskrevet");
}

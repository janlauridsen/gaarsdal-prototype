export function countQuestions(text: string): number {
  return (text.match(/\?/g) || []).length;
}

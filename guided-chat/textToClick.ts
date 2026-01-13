export function mapTextToClick(text: string) {
  const t = text.toLowerCase();
  if (t.includes("kontakt")) return "CONTACT";
  if (t.includes("hypnoterapi")) return "FACTS_HYPNO";
  if (t.includes("relevant")) return "TRIAGE";
  return null;
}

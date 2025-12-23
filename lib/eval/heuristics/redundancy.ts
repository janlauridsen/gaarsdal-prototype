export function redundancyScore(
  original: string,
  updated: string
): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\wæøå ]/gi, "")
      .trim();

  const o = normalize(original);
  const n = normalize(updated);

  if (!o || !n) return 0;

  if (o === n) return 1;

  // meget simpel overlap-måling
  const oWords = new Set(o.split(" "));
  const nWords = new Set(n.split(" "));

  const overlap = [...oWords].filter((w) => nWords.has(w));

  return overlap.length / Math.max(oWords.size, 1);
}

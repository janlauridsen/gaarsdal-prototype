// lib/eval/heuristics/redundancy.ts

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

  const oWords = o.split(" ");
  const nWordsSet: { [key: string]: true } = {};

  for (let i = 0; i < nWordsSet.length; i++) {
    // placeholder – vi bygger nedenfor
  }

  // byg lookup-table
  for (let i = 0; i < n.split(" ").length; i++) {
    nWordsSet[n.split(" ")[i]] = true;
  }

  let overlapCount = 0;

  for (let i = 0; i < oWords.length; i++) {
    if (nWordsSet[oWords[i]]) {
      overlapCount++;
    }
  }

  return overlapCount / Math.max(oWords.length, 1);
}

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
  const nWords = n.split(" ");

  // lookup-table (ES5-safe)
  const nWordMap: { [key: string]: true } = {};
  for (let i = 0; i < nWords.length; i++) {
    nWordMap[nWords[i]] = true;
  }

  let overlap = 0;
  for (let i = 0; i < oWords.length; i++) {
    if (nWordMap[oWords[i]]) {
      overlap++;
    }
  }

  return overlap / Math.max(oWords.length, 1);
}

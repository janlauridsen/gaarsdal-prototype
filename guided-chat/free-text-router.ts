import { ResolvedIntent } from "./intents";
import { NodeConfig } from "./nodes";

type Params = {
  text: string;
  node: NodeConfig;
};

export function resolveFreeTextIntent({
  text,
  node,
}: Params): ResolvedIntent | null {
  const t = text.toLowerCase();

  /* CHIP MATCH */
  for (const chip of node.navigation.chips) {
    if (t.includes(chip.toLowerCase())) {
      return { kind: "CHIP", chipId: chip };
    }
  }

  /* PARENTESE */
  for (const n of node.navigation.freeText.allowParentesTo ?? []) {
    if (t.includes(n.toLowerCase())) {
      return { kind: "PARENTESE", nodeId: n };
    }
  }

  /* NEW SESSION */
  if (node.navigation.freeText.allowNewSession) {
    if (
      t.includes("ny samtale") ||
      t.includes("nyt fokus") ||
      t.includes("forfra")
    ) {
      return { kind: "NEW_SESSION" };
    }
  }

  return null;
}

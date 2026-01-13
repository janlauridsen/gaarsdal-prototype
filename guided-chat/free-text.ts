// guided-chat/free-text.ts

import { NodeId } from "./node-router";

export type FreeTextResult = {
  answer: string;
  flags?: {
    off_scope?: boolean;
    medical_risk?: boolean;
  };
};

export function handleFreeText(
  node: NodeId,
  text: string
): FreeTextResult {
  switch (node) {
    case "ROOT":
      return {
        answer:
          "Vælg en mulighed via knapperne ovenfor for at fortsætte.",
        flags: { off_scope: true },
      };

    case "CONTACT":
      return {
        answer:
          "Her finder du kontaktoplysninger. Brug knappen for at gå tilbage.",
      };

    case "FACTS":
      return {
        answer:
          "Her gives generel viden om hypnoterapi. Ingen personlig rådgivning.",
      };

    case "TRIAGE":
      return {
        answer:
          "Jeg kan stille afklarende spørgsmål for at vurdere relevans. Beskriv kort din situation.",
      };

    case "TRIAGE_DONE":
      return {
        answer:
          "Triage er afsluttet. Du kan vælge næste skridt via knapperne.",
      };

    default:
      return {
        answer: "Ugyldig tilstand.",
        flags: { off_scope: true },
      };
  }
}

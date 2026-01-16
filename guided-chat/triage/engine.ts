import { TriageState, TriageOutcome } from "./state";

export type TriageContext = {
  state: TriageState;
  answers: Record<string, string>;
};

export function triageStep(
  ctx: TriageContext,
  input: string
): { ctx: TriageContext; question?: string; outcome?: TriageOutcome } {
  switch (ctx.state) {
    case "T0_START":
      return {
        ctx: { ...ctx, state: "T1_PROBLEM_TYPE" },
        question: "Hvad ønsker du hjælp til? (kort beskrivelse)",
      };

    case "T1_PROBLEM_TYPE":
      return {
        ctx: {
          state: "T2_DURATION_SEVERITY",
          answers: { ...ctx.answers, problem: input },
        },
        question: "Hvor længe har det stået på, og hvor meget fylder det?",
      };

    case "T2_DURATION_SEVERITY":
      return {
        ctx: {
          state: "T3_EXPECTATION",
          answers: { ...ctx.answers, duration: input },
        },
        question: "Hvad håber du, hypnoterapi kan hjælpe med?",
      };

    case "T3_EXPECTATION":
      return {
        ctx: {
          state: "T4_CONCLUSION",
          answers: { ...ctx.answers, expectation: input },
        },
        outcome: decideOutcome(ctx.answers),
      };

    default:
      return { ctx };
  }
}

function decideOutcome(a: Record<string, string>): TriageOutcome {
  if (/smerte|traume|psyki/i.test(JSON.stringify(a))) return "CONTACT_JAN";
  if (/nysgerrig|prøve|afslap/i.test(JSON.stringify(a))) return "BOOK";
  return "NOT_RELEVANT";
}

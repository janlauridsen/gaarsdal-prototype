import { NODE_TABLE } from "./nodeTable";
import { triageStep } from "./triage/engine";

export type Input =
  | { kind: "CLICK"; target: string }
  | { kind: "TEXT"; text: string };

export type Session = {
  node: string;
  triage?: any;
};

export function route(session: Session, input: Input) {
  // direkte hop altid tilladt
  if (input.kind === "CLICK") {
    return { session: { node: input.target } };
  }

  const node = NODE_TABLE[session.node];

  if (node.type === "DIALOG" && session.node === "TRIAGE") {
    const res = triageStep(
      session.triage ?? { state: "T0_START", answers: {} },
      input.text
    );

    if (res.outcome) {
      return { session: { node: "TRIAGE_DONE" }, outcome: res.outcome };
    }

    return {
      session: { node: "TRIAGE", triage: res.ctx },
      question: res.question,
    };
  }

  // fritekst uden for dialog → fortolk som evt. menu-intent
  return { session };
}

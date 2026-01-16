export type TriageState =
  | "T0_START"
  | "T1_PROBLEM_TYPE"
  | "T2_DURATION_SEVERITY"
  | "T3_EXPECTATION"
  | "T4_CONCLUSION";

export type TriageOutcome =
  | "BOOK"
  | "CONTACT_JAN"
  | "NOT_RELEVANT";

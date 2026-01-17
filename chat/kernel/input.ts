// chat/kernel/input.ts

import { NodeId } from "./types";

/**
 * Input-signal fra UI eller system.
 * Dette er WRITE-model.
 */
export type InputSignal =
  | ExplicitTransitionSignal
  | FreeTextSignal
  | SystemSignal;

/**
 * Brugeren har valgt en eksplicit transition
 * (fx chip, ikon, home/mail/phone/akut)
 */
export type ExplicitTransitionSignal = {
  kind: "EXPLICIT_TRANSITION";
  target: NodeId;
  source: "chip" | "icon" | "system";
};

/**
 * Brugeren har skrevet fritekst.
 * Fortolkes af engine – aldrig af UI.
 */
export type FreeTextSignal = {
  kind: "FREE_TEXT";
  text: string;
};

/**
 * System-intern trigger
 * (fx resume, timeout, forced redirect)
 */
export type SystemSignal = {
  kind: "SYSTEM";
  intent: string;
  payload?: unknown;
};

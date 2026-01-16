/**
 * guided-chat/node-ui.ts
 *
 * ⚠️ DEPRECATED
 *
 * UI-modellen for noder håndteres nu dynamisk
 * via API-respons (message + chips).
 *
 * Denne fil bevares udelukkende for kompatibilitet
 * og må ikke indeholde node-specifik logik.
 *
 * Version:
 * - V10.3
 */

import { Chip } from "./chips";
import { NodeId } from "./node-router";

/**
 * Legacy placeholder.
 * Returnerer altid tomt chip-sæt.
 */
export function getNodeChips(_node: NodeId): Chip[] {
  return [];
}

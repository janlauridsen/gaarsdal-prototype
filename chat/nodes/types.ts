/**
 * NODE-CONTRACT
 * Data-only. Ingen adfærd. Ingen logik.
 * Afledt af Artefakt 6 og 7.
 */

import { NodeId } from "../kernel";

/* =========================
   NODE KIND
========================= */

export type NodeKind =
  | "MENU"
  | "STATIC"
  | "DIALOG"
  | "TERMINAL";

/* =========================
   NODE CONTENT
========================= */

export type NodeContent = {
  message: string;
};

/* =========================
   NAVIGATION (DECLARATIVE)
========================= */

export type NodeNavigation = {
  /**
   * Tilladte eksplicitte transitions (chips, ikoner, system)
   * Lukket mængde.
   */
  allowed: NodeId[];

  /**
   * Om fri tekst accepteres i noden.
   * Ingen implicit routing.
   */
  allow_free_text: boolean;

  /**
   * Om noden må åbne parentes (nested dialog).
   */
  allow_parentese: boolean;
};

/* =========================
   NODE DEFINITION
========================= */

export type NodeDefinition = {
  id: NodeId;
  kind: NodeKind;
  content: NodeContent;
  navigation: NodeNavigation;
};

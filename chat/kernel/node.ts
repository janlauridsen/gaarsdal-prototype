// chat/kernel/node.ts

import { NodeId } from "./types";

/**
 * Node-typer.
 * Bruges kun semantisk. Ingen adfærd.
 */
export type NodeKind =
  | "MENU"
  | "DIALOG"
  | "STATIC"
  | "TERMINAL";

/**
 * Fritekst-kontrakt for en node.
 * Fortolkes af engine – ikke af noden.
 */
export type FreeTextPolicy = {
  allowed: boolean;

  /**
   * Om fritekst må foreslå ny session
   */
  allow_new_session: boolean;

  /**
   * Om fritekst må åbne parentes (nested)
   */
  allow_parents: boolean;
};

/**
 * Node-definition.
 * Ren data.
 */
export type NodeDefinition = {
  id: NodeId;
  kind: NodeKind;

  /**
   * Primær tekst der projiceres til UI
   */
  message: string;

  /**
   * Eksplicitte transitions brugeren kan vælge
   * (fx chips)
   */
  transitions: NodeId[];

  /**
   * Fritekst-regler
   */
  free_text: FreeTextPolicy;

  /**
   * Om noden afslutter samtalen
   */
  terminal?: boolean;

  /**
   * Valgfri beskrivelse til governance / review
   */
  description?: string;
};

/**
 * Node-katalog.
 * Dette er IKKE state.
 */
export type NodeCatalog = Record<NodeId, NodeDefinition>;

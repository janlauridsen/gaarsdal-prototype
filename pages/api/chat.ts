// pages/api/chat.ts

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

import { NODES } from "../../guided-chat/nodes";
import { ROUTES } from "../../guided-chat/node-router";
import { Chip } from "../../guided-chat/chips";
import { NodeId } from "../../guided-chat/node-router";

import { writeTurnLog } from "../../logging/logWriter";
import { TurnLog } from "../../logging/log.types";

/* =====================
   CONFIG
===================== */

const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000;

/* =====================
   HELPERS
===================== */

function nowISO() {
  return new Date().toISOString();
}

function loadPrompt(name?: string): string | null {
  if (!name) return null;
  const p = path.join(process.cwd(), "prompts", name);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

function isChip(value: any): value is Chip {
  return typeof value === "string";
}

function resolveNextNode(
  current: NodeId,
  chip?: Chip
): NodeId {
  if (!chip) return current;
  const next = ROUTES[current]?.[chip];
  return next ?? current;
}

/* =====================
   API HANDLER
===================== */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const startedAt = Date.now();

  const {
    sessionId,
    nodeId,
    chip,
    text,
  }: {
    sessionId: string;
    nodeId?: NodeId;
    chip?: Chip;
    text?: string;
  } = req.body ?? {};

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  const currentNode: NodeId = nodeId ?? "ROOT";
  const node = NODES[currentNode];

  if (!node) {
    return res.status(400).json({ error: "Invalid node" });
  }

  /* =====================
     NODE TRANSITION
  ===================== */

  let nextNodeId = currentNode;

  if (chip && isChip(chip)) {
    nextNodeId = resolveNextNode(currentNode, chip);
  }

  const nextNode = NODES[nextNodeId];

  if (!nextNode) {
    return res.status(400).json({ error: "Invalid transition" });
  }

  /* =====================
     RESPONSE PAYLOAD
  ===================== */

  const promptText =
    nextNode.kind && nextNode.kind !== "MENU"
      ? loadPrompt(nextNode.prompt)
      : null;

  const response = {
    sessionId,
    nodeId: nextNodeId,
    kind: nextNode.kind ?? "MENU",
    message: nextNode.message,
    chips: nextNode.chips,
    prompt: promptText, // UI kan vælge at vise / skjule
    terminal: nextNode.terminal ?? false,
  };

  /* =====================
     LOGGING
  ===================== */

  const log: TurnLog = {
    timestamp: nowISO(),
    session_id: sessionId,
    turn_id: Date.now(), // simpelt og stabilt i fase 1
    user_input: chip ?? text ?? "",
    jan_raw_output: "",
    jan_final_output: response.message,
    evaluator_present: false,
    telemetry: {
      node_from: currentNode,
      node_to: nextNodeId,
      chip: chip ?? null,
      free_text: text ?? null,
      node_kind: nextNode.kind ?? "MENU",
    },
    latency_ms: Date.now() - startedAt,
    status: "ok",
  };

  await writeTurnLog(log);

  return res.status(200).json(response);
}


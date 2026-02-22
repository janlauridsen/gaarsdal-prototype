// pages/api/trace.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const INDEX_KEY = "gaarsdal:index:conversations:recent";
const STATE_PREFIX = "gaarsdal:state:";
const V1_EVENTS_PREFIX = "gaarsdal:events:v1:conv:";
const SPINE_PREFIX = "gaarsdal:spine:v23:events:";
const RAW_PREFIX = "gaarsdal:raw:conversation:";

// Reflection async outputs
const REFLECTION_CASE_PREFIX = "gaarsdal:reflection:v1:case:";
const FOCUS_PLAN_PREFIX = "gaarsdal:reflection:focus_plan:v1:";

function asString(q: string | string[] | undefined): string | undefined {
  return Array.isArray(q) ? q[0] : q;
}

function asBoolFlag(v: string | undefined): boolean {
  if (!v) return false;
  return v === "1" || v.toLowerCase() === "true" || v.toLowerCase() === "yes" || v.toLowerCase() === "on";
}

function safeJsonParse<T = any>(v: any): T | any {
  if (v == null) return v;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function isoToMs(iso: any): number | null {
  if (!iso) return null;
  if (typeof iso === "number") return iso;
  if (typeof iso === "string") {
    const ms = Date.parse(iso);
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

type TurnGroup = {
  input_id: number | null;
  revision: number | null;
  started_at_ms: number | null;
  ended_at_ms: number | null;

  // v1
  input_received?: any;
  transition_applied?: any[];
  node_rendered?: any;

  // raw
  raw?: any;

  // spine
  spine?: any[];

  // diagnostics (optional)
  diagnostics?: {
    line: string;
    block: string;
    scores?: {
      progress_score?: number;
      repetition_score?: number;
      fatigue_signal?: number;
      novelty_score?: number;
      stall_counter?: number;
      stall_detected?: boolean;
      functional_impairment?: number;
      dependency_risk?: number;
      escalation_velocity?: number;
      family_impact?: number;
      safety_flag?: boolean;
      override_active?: boolean;
    };
  };
};

function setBounds(g: TurnGroup, t: number | null) {
  if (t == null) return;
  if (g.started_at_ms == null || t < g.started_at_ms) g.started_at_ms = t;
  if (g.ended_at_ms == null || t > g.ended_at_ms) g.ended_at_ms = t;
}

function pickClosestByTime<T extends { _ms?: number | null }>(
  candidates: T[],
  targetMs: number | null
): T | null {
  if (!candidates.length) return null;
  if (targetMs == null) return candidates[0] ?? null;
  let best: T | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    const ms = c._ms ?? null;
    const dist = ms == null ? Infinity : Math.abs(ms - targetMs);
    if (dist < bestDist) {
      bestDist = dist;
      best = c;
    }
  }
  return best ?? candidates[0] ?? null;
}

function clampInt(v: any, def: number, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  const i = Math.trunc(n);
  return Math.max(min, Math.min(max, i));
}

function fmt01(n: any): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "n/a";
  const v = Math.max(0, Math.min(1, n));
  return v.toFixed(2);
}

function labelScore(n: any): "Low" | "Mod" | "High" | "n/a" {
  if (typeof n !== "number" || !Number.isFinite(n)) return "n/a";
  if (n < 0.25) return "Low";
  if (n < 0.6) return "Mod";
  return "High";
}

function getCaseScores(caseSchema: any) {
  const dd = caseSchema?.dialog_dynamics ?? {};
  const re = caseSchema?.risk_engine ?? {};
  return {
    novelty_score: typeof dd?.novelty_score === "number" ? dd.novelty_score : undefined,
    repetition_score: typeof dd?.repetition_score === "number" ? dd.repetition_score : undefined,
    fatigue_signal: typeof dd?.fatigue_signal === "number" ? dd.fatigue_signal : undefined,
    progress_score: typeof dd?.progress_score === "number" ? dd.progress_score : undefined,
    stall_counter: typeof dd?.stall_counter === "number" ? dd.stall_counter : undefined,
    stall_detected: typeof dd?.stall_detected === "boolean" ? dd.stall_detected : undefined,

    functional_impairment: typeof re?.functional_impairment === "number" ? re.functional_impairment : undefined,
    dependency_risk: typeof re?.dependency_risk === "number" ? re.dependency_risk : undefined,
    escalation_velocity: typeof re?.escalation_velocity === "number" ? re.escalation_velocity : undefined,
    family_impact: typeof re?.family_impact === "number" ? re.family_impact : undefined,
    safety_flag: typeof re?.safety_flag === "boolean" ? re.safety_flag : undefined,
    override_active: typeof re?.override_active === "boolean" ? re.override_active : undefined,
  };
}

function buildDiagnostics(caseSchema: any, focusPlan: any): { line: string; block: string; scores: any } {
  const scores = getCaseScores(caseSchema);

  const markers = Array.isArray(focusPlan?.process_markers) ? focusPlan.process_markers : [];

  const shortMarkers = markers
    .slice(0, 3)
    .map((m: any) => {
      const t = typeof m?.type === "string" ? m.type : "unknown";
      const s = typeof m?.strength === "string" ? m.strength : "unknown";
      return `${t}:${s}`;
    })
    .join("|");

  const blockMarkers = markers
    .slice(0, 3)
    .map((m: any) => {
      const t = typeof m?.type === "string" ? m.type : "unknown";
      const s = typeof m?.strength === "string" ? m.strength : "unknown";
      const ev = typeof m?.evidence === "string" ? m.evidence : "";
      const evShort = ev.length > 160 ? `${ev.slice(0, 160)}…` : ev;
      return `- ${t} (${s}): "${evShort}"`;
    })
    .join("\n");

  const hasChangeTalk = markers.some(
    (m: any) =>
      m?.type === "change_talk" && (m?.strength === "moderate" || m?.strength === "strong")
  );
  const hasStrongVulnerability = markers.some(
    (m: any) => m?.type === "vulnerability" && m?.strength === "strong"
  );

  // Debug-only stance (deterministic). Not used for user-facing output.
  // Goal: make "phase/fremdrift" visible in trace.
  let stance = "REFLECT_CLARIFY";
  if (scores.override_active === true || scores.safety_flag === true) stance = "STABILIZE";
  else if (scores.stall_detected === true && hasChangeTalk) stance = "ELICIT_HELP";
  else if (hasChangeTalk) stance = "ELICIT_HELP";
  else if (hasStrongVulnerability) stance = "REFLECT_DEEPEN";

  const prog = scores.progress_score;
  const rep = scores.repetition_score;
  const fat = scores.fatigue_signal;

  const line =
    `prog=${labelScore(prog)}(${fmt01(prog)}) ` +
    `rep=${labelScore(rep)}(${fmt01(rep)}) ` +
    `fat=${labelScore(fat)}(${fmt01(fat)}) ` +
    `stall=${scores.stall_detected === true ? "Y" : scores.stall_detected === false ? "N" : "n/a"} ` +
    `markers=${shortMarkers || "none"} ` +
    `stance=${stance}`;

  const block =
    "[Reflection Diagnostics]\n" +
    `scores:\n` +
    `- progress: ${labelScore(prog)} (${fmt01(prog)})\n` +
    `- repetition: ${labelScore(rep)} (${fmt01(rep)})\n` +
    `- fatigue: ${labelScore(fat)} (${fmt01(fat)})\n` +
    `- stall: ${scores.stall_detected === true ? "YES" : scores.stall_detected === false ? "NO" : "n/a"} (counter=${typeof scores.stall_counter === "number" ? scores.stall_counter : "n/a"})\n` +
    `risk:\n` +
    `- functional_impairment: ${fmt01(scores.functional_impairment)}\n` +
    `- dependency_risk: ${fmt01(scores.dependency_risk)}\n` +
    `- family_impact: ${fmt01(scores.family_impact)}\n` +
    `- safety_flag: ${scores.safety_flag === true ? "true" : "false"}\n` +
    `- override_active: ${scores.override_active === true ? "true" : "false"}\n` +
    `process markers:\n${blockMarkers || "- none"}\n` +
    `stance (debug): ${stance}`;

  return { line, block, scores };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // --- Simple URL syntax (aliases) ---
    // conversation id: ?conversation_id=... or ?c=... or ?cid=...
    const conversation_id =
      asString(req.query.conversation_id) ||
      asString(req.query.c) ||
      asString(req.query.cid);

    // diagnostics: ?diagnostics=1 or ?d=1 or ?diag=1
    const diagnosticsEnabled =
      asBoolFlag(asString(req.query.diagnostics)) ||
      asBoolFlag(asString(req.query.d)) ||
      asBoolFlag(asString(req.query.diag));

    // limit: default 50, hard cap 50 (per your request)
    const limit =
      clampInt(
        asString(req.query.limit) ?? asString(req.query.n) ?? 50,
        50,
        1,
        50
      );

    // LIST (no conversation id)
    if (!conversation_id) {
      const ids = await redis.zrange<string[]>(INDEX_KEY, 0, 200, { rev: true });
      return res.status(200).json({ conversations: ids ?? [] });
    }

    const stateKey = `${STATE_PREFIX}${conversation_id}`;
    const v1Key = `${V1_EVENTS_PREFIX}${conversation_id}`;
    const spineKey = `${SPINE_PREFIX}${conversation_id}`;
    const rawKey = `${RAW_PREFIX}${conversation_id}`;

    const [stateRaw, v1Raw, spineRaw, rawRaw] = await Promise.all([
      redis.get(stateKey),
      (redis as any).lrange?.(v1Key, -limit, -1) ?? [],
      (redis as any).lrange?.(spineKey, -limit, -1) ?? [],
      (redis as any).lrange?.(rawKey, -limit, -1) ?? [],
    ]);

    const state = safeJsonParse(stateRaw);
    const v1Events = (Array.isArray(v1Raw) ? v1Raw : []).map(safeJsonParse);
    const spineEvents = (Array.isArray(spineRaw) ? spineRaw : []).map(safeJsonParse);
    const rawTurns = (Array.isArray(rawRaw) ? rawRaw : []).map(safeJsonParse);

    // TTL (state)
    let ttl_ms: number | null = null;
    try {
      ttl_ms = await redis.pttl(stateKey);
    } catch {
      try {
        const ttl_s = await redis.ttl(stateKey);
        ttl_ms = typeof ttl_s === "number" ? ttl_s * 1000 : null;
      } catch {
        ttl_ms = null;
      }
    }

    // ---- Build groups from V1 events by input_id ----
    const byInputId = new Map<number, TurnGroup>();

    function getGroup(input_id: number | null): TurnGroup {
      const id = input_id ?? -1;
      let g = byInputId.get(id);
      if (!g) {
        g = {
          input_id: input_id ?? null,
          revision: null,
          started_at_ms: null,
          ended_at_ms: null,
          transition_applied: [],
          spine: [],
        };
        byInputId.set(id, g);
      }
      return g;
    }

    for (const e of v1Events) {
      const input_id = typeof e?.input_id === "number" ? e.input_id : null;
      const revision = typeof e?.revision === "number" ? e.revision : null;
      const t = typeof e?.timestamp_ms === "number" ? e.timestamp_ms : null;

      const g = getGroup(input_id);
      if (g.revision == null && revision != null) g.revision = revision;
      setBounds(g, t);

      const et = e?.event_type;
      if (et === "input_received") g.input_received = e;
      else if (et === "transition_applied") (g.transition_applied ??= []).push(e);
      else if (et === "node_rendered") g.node_rendered = e;
      else {
        (g.transition_applied ??= []).push(e);
      }
    }

    // Convert to array and sort by time
    let groups: TurnGroup[] = Array.from(byInputId.values()).filter((g) => g.input_id !== -1);
    groups.sort((a, b) => (a.started_at_ms ?? 0) - (b.started_at_ms ?? 0));

    // If no V1 groups exist (edge), create a single group and attach everything
    if (!groups.length) {
      groups = [
        {
          input_id: null,
          revision: typeof state?.revision === "number" ? state.revision : null,
          started_at_ms: null,
          ended_at_ms: null,
          transition_applied: [],
          spine: [],
        },
      ];
    }

    // ---- Attach RAW turns to closest group by revision then time ----
    const rawWithMs = rawTurns.map((t: any) => ({ ...t, _ms: isoToMs(t?.ts) }));
    for (const rt of rawWithMs) {
      const rrev = typeof rt?.revision === "number" ? rt.revision : null;
      const rms = rt._ms ?? null;

      const candidates = groups
        .filter((g) => (rrev == null ? true : g.revision === rrev))
        .map((g) => ({ g, _ms: g.started_at_ms }));

      const picked = pickClosestByTime(candidates as any, rms);
      const target = (picked as any)?.g as TurnGroup | undefined;
      if (!target) continue;

      // If multiple raw entries map to same group, keep the closest to node_rendered time if possible
      if (!target.raw) {
        target.raw = rt;
      } else {
        const existingMs = (target.raw as any)?._ms ?? null;
        const targetAnchor = target.ended_at_ms ?? target.started_at_ms ?? null;
        const newDist = targetAnchor == null || rms == null ? Infinity : Math.abs(rms - targetAnchor);
        const oldDist =
          targetAnchor == null || existingMs == null ? Infinity : Math.abs(existingMs - targetAnchor);
        if (newDist < oldDist) target.raw = rt;
      }

      setBounds(target, rms);
    }

    // ---- Attach SPINE events to closest group by revision_after then time ----
    const spineWithMs = spineEvents.map((e: any) => ({ ...e, _ms: isoToMs(e?.ts) }));
    for (const se of spineWithMs) {
      const revAfter = typeof se?.revision_after === "number" ? se.revision_after : null;
      const ms = se._ms ?? null;

      const candidates = groups
        .filter((g) => (revAfter == null ? true : g.revision === revAfter))
        .map((g) => ({ g, _ms: g.started_at_ms }));

      const picked = pickClosestByTime(candidates as any, ms);
      const target = (picked as any)?.g as TurnGroup | undefined;
      if (!target) continue;

      (target.spine ??= []).push(se);
      setBounds(target, ms);
    }

    // Normalize: ensure arrays
    for (const g of groups) {
      g.transition_applied = Array.isArray(g.transition_applied) ? g.transition_applied : [];
      g.spine = Array.isArray(g.spine) ? g.spine : [];
      // sort internal arrays
      g.transition_applied.sort((a, b) => (a?.timestamp_ms ?? 0) - (b?.timestamp_ms ?? 0));
      g.spine.sort((a, b) => (a?._ms ?? 0) - (b?._ms ?? 0));
    }

    // ---- Optional: Enrich groups with diagnostics (case schema + focus plan) ----
    if (diagnosticsEnabled) {
      // Read the reflection case once (conversation-level)
      const caseKey = `${REFLECTION_CASE_PREFIX}${conversation_id}`;
      const caseRaw = await redis.get(caseKey);
      const reflectionCase = safeJsonParse(caseRaw);

      // Read focus plan per group revision (bounded by limit=<=50)
      for (const g of groups) {
        const rev = g.revision;
        if (typeof rev !== "number") continue;

        const focusKey = `${FOCUS_PLAN_PREFIX}${conversation_id}:${rev}`;
        const focusRaw = await redis.get(focusKey);
        if (!focusRaw) continue;

        const focusPlan = safeJsonParse(focusRaw);
        const diag = buildDiagnostics(reflectionCase, focusPlan);
        g.diagnostics = { line: diag.line, block: diag.block, scores: diag.scores };
      }
    }

    return res.status(200).json({
      conversation_id,
      // expose aliases used, for debugging request parsing
      request: {
        diagnosticsEnabled,
        limit,
        aliases: {
          conversation_id_from: conversation_id ? "conversation_id|c|cid" : null,
          diagnostics_from: diagnosticsEnabled ? "diagnostics|d|diag" : null,
          limit_from: asString(req.query.limit) ? "limit" : asString(req.query.n) ? "n" : "default",
        },
      },
      keys: { stateKey, v1Key, spineKey, rawKey },
      ttl_ms,
      state,
      counts: {
        v1: v1Events.length,
        spine: spineEvents.length,
        raw: rawTurns.length,
        groups: groups.length,
      },
      groups,
      // keep raw lists in response for debugging
      v1Events,
      spineEvents,
      rawTurns,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}

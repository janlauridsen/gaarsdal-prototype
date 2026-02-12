# MetaLedger v1 Specification

## Purpose

MetaLedger v1 defines how global metadata is collected and resolved across multiple dialog threads (capabilities) in a persistent, multi-week user session.

Goals:
- Preserve user-provided information so it can be implicitly reused later.
- Avoid conflicts when multiple dialog threads write related information.
- Provide provenance for all meta facts (who/when/with what confidence).
- Keep policies simple for v1 and registry-driven for future expansion.

Retention:
- 30 days (conversation + ledger + logs) as the default retention window.

Non-goals (v1):
- Complex rule engines.
- Per-key retention windows.
- Full migration removal of legacy meta keys (double-write is allowed in v1).


---

## Definitions

### Fact

A Fact is an immutable assertion written to the ledger.

Minimum required fields:

- `value: unknown`
- `source_node: string` (NodeId)
- `source_thread_id: string | null`
- `source_capability_id: string | null`
- `ts: number` (epoch milliseconds)
- `confidence: number` (0..1)
- `status: "active" | "deprecated"`

### Ledger

- `ledger[key] = Fact[]`

A key MAY have multiple facts over time. Resolution determines the "current" value.

### Resolution Policies (v1)

- `latest_active_wins`  
  Select the newest Fact with `status="active"`.

- `union_dedup`  
  Facts contribute array-like values; the current value is a deduplicated union.
  - If `value` is not an array of strings, it is ignored.
  - Deduplication is case-sensitive in v1 (upgradeable later).

- `max_confidence_latest_tie`  
  Prefer higher `confidence`. If equal confidence, prefer newest.

- `boolean_or`  
  For boolean facts only. Current value is OR across active facts.
  (Not used for red_flags in v1.)

### Ownership

A key has a writer-ownership policy:
- `open` — any node/capability may write.
- `restricted` — only specific nodes/capabilities may write.

Ownership prevents "wrong subsystem writes" from creating confusing global state.


---

## Canonical Keys (v1)

This section is the authoritative list of keys, their policy, and ownership.

### A) User Intent & Problem (Global)

1) `user.goal`  
- Type: `string`  
- Policy: `latest_active_wins`  
- Ownership: `open`  
- Meaning: user-stated desired outcome.

2) `user.topic_tags`  
- Type: `string[]`  
- Policy: `union_dedup`  
- Ownership: `open`  
- Meaning: topic tags describing themes across dialogs.

3) `user.key_triggers`  
- Type: `string[]`  
- Policy: `union_dedup`  
- Ownership: `open`  
- Meaning: triggers/situations/feelings the user associates with the issue.

4) `user.time_horizon`  
- Type: `string`  
- Policy: `latest_active_wins`  
- Ownership: `open`  
- Meaning: timeframe expectation ("weeks", "months", etc.).


### B) Preferences & Contact (Global)

5) `prefs.tone`  
- Type: `string`  
- Policy: `latest_active_wins`  
- Ownership: `open`  
- Meaning: style preference (short/reflective/structured).

6) `prefs.contact_channel`  
- Type: `"TLF" | "MAIL" | "FORM"` (stored as string)  
- Policy: `latest_active_wins`  
- Ownership: `open`  
- Meaning: preferred contact channel.

7) `prefs.language`  
- Type: `string`  
- Policy: `latest_active_wins`  
- Ownership: `open`  
- Meaning: preferred language.

8) `consent.store_session`  
- Type: `boolean`  
- Policy: `latest_active_wins`  
- Ownership: `open`  
- Meaning: whether the user consents to session persistence (future compliance hook).


### C) Triage (Global, Restricted)

9) `triage.relevance`  
- Type: `"YES" | "LIKELY" | "UNCLEAR" | "NO"` (stored as string)  
- Policy: `latest_active_wins`  
- Ownership: `restricted`  
- Allowed writers: capability `triage-relevance-v1`, node `TRIAGE`  
- Meaning: triage relevance assessment.

10) `triage.confidence`  
- Type: `number` (0..1)  
- Policy: `max_confidence_latest_tie`  
- Ownership: `restricted`  
- Allowed writers: capability `triage-relevance-v1`, node `TRIAGE`  
- Meaning: confidence score of triage decision.

11) `triage.outcome`  
- Type: `string`  
- Policy: `latest_active_wins`  
- Ownership: `restricted`  
- Allowed writers: capability `triage-relevance-v1`, node `TRIAGE`  
- Meaning: derived outcome (e.g. FIT_BOOKING / NEEDS_ASSESSMENT / NOT_RELEVANT).


### D) Constraints & Safety (Global)

12) `constraints.red_flags`  
- Type: `string[]`  
- Policy: `union_dedup`  
- Ownership: `open` (v1)  
- Meaning: safety/constraint tags. Append-only union.
  - Example tags: "acute", "self_harm", "medical", "urgent_support"


---

## Writing Rules

1) Facts MUST include provenance fields (`source_*`, `ts`, `confidence`).
2) Writers SHOULD keep confidence conservative and meaningful (avoid always 1.0).
3) Writers SHOULD NOT overwrite by mutation; they append a new Fact.
4) Restricted keys MUST reject writes from unauthorized nodes/capabilities.
5) Facts MAY be deprecated:
   - either explicitly (write a new Fact and mark older as deprecated),
   - or implicitly (resolution ignores older facts by policy).
   v1 allows both approaches.


---

## Legacy Compatibility (v1)

During migration, the system MAY double-write:
- existing legacy keys (e.g. `triage.user_goal`) AND canonical keys (e.g. `user.goal`).

Recommended mapping from legacy triage keys:
- `triage.user_goal` -> `user.goal`
- `triage.topic_tags` -> `user.topic_tags`
- `triage.key_triggers` -> `user.key_triggers`
- `triage.time_horizon` -> `user.time_horizon`
- `triage.confidence` -> `triage.confidence`
- `triage.outcome` -> `triage.outcome`
- `triage.outcome` or equivalent -> `triage.relevance` (if distinct values exist, prefer explicit relevance)


---

## Implementation Notes (Non-binding)

- Store ledger in a single persisted document per conversation for simplicity.
- Apply a 30-day TTL at the conversation level in v1.
- Add per-key TTL and richer conflict strategies in v2.

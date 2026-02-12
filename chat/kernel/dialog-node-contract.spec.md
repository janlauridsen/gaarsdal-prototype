# Dialog Node Contract v1

## Purpose

This specification defines how the registry describes nodes that are:
- Static (single-step informational nodes), or
- Dialog (multi-turn, capability-driven nodes).

It also defines the generic execution model so that API routes do not contain node-specific special-cases (e.g. TRIAGE branching).

This contract is compatible with:
- Session Model A (cookie-based, 30-day retention)
- MetaLedger v1 (append-only facts with provenance)
- Multi-thread dialogs per conversation (per capability)


---

## Definitions

### NodeId
A stable string identifier for a node, used by kernel and registry.

### CapabilityId
A stable string identifier for an AI/dialog capability.

### ThreadId
A stable string identifier for a dialog thread instance under a conversation.

### Node Kind
- `static`: node produces a message and optionally provides transitions.
- `dialog`: node delegates to a capability and maintains a thread.

### Inputs
The system distinguishes between:
- `EXPLICIT_TRANSITION` (user selects a target node)
- `FREE_TEXT` (user provides natural language input)

The kernel MUST treat these generically regardless of which node is active.


---

## Registry Schema (v1)

Each node entry MUST define:

### Common
- `id: NodeId`
- `kind: "static" | "dialog"`
- `title: string` (UI label; not necessarily shown)
- `message: string` (default assistant message when entering node)
- `allowed_transitions: NodeId[]` (explicit navigation options)
- `meta_domains_written: string[]` (legacy support; see MetaLedger migration notes)

### Static Nodes
Static nodes do not require a capability.

Additional optional fields:
- `static_actions?: Array<{ id: string, label: string, type: "link" | "phone" | "mail" }>`
- `ui_hints?: { section?: string, priority?: number }`

### Dialog Nodes
Dialog nodes MUST define:

- `capability_id: CapabilityId`
- `thread_policy: {
    scope: "conversation",
    thread_key: string
  }`

Interpretation:
- `scope: "conversation"` means the thread persists inside the conversation.
- `thread_key` is a stable identifier for the dialog type within the conversation:
  - e.g. `"triage"`, `"gen_hypno"`, `"alt_screen"`
- A conversation MUST have at most one active thread per `thread_key` unless a future version introduces branching threads.

Dialog nodes SHOULD define:

- `capability_policy: {
    on_enter?: "prompt" | "idle",
    on_free_text: "delegate",
    allow_free_text_when_inactive?: boolean
  }`

Recommended v1 values:
- `on_enter: "prompt"` (capability produces the assistant message and suggestions when first entering)
- `on_free_text: "delegate"` (free text is routed into capability)
- `allow_free_text_when_inactive: false`


---

## Generic Execution Model

### High-Level Principle
`/api/chat` MUST NOT contain node-specific branching such as:
- "if active_node === TRIAGE and input is FREE_TEXT ..."

Instead:

1) The API loads persisted conversation.
2) It calls the kernel to determine:
   - whether the input can be handled by the kernel directly, or
   - whether a capability is required by the active node.
3) If required, it calls the capability generically based on registry data.
4) Kernel applies transition + meta changes.
5) Persist and return response.

### Capability Interaction Contract (v1)

A capability invocation produces:

- `assistant_message: string`
- `thread_log_delta: LogEvent[]` (append-only)
- `thread_state_delta: object` (capability-specific)
- `meta_facts_delta: Array<{ key: string, fact: Fact }>`
- `transition_suggestion?: { to?: NodeId, reason: string }`

Notes:
- In v1, `assistant_message` MAY be embedded as `transition.response_message` for compatibility with existing UI.
- Meta writes MUST be expressed as facts for MetaLedger v1, not direct mutation.

### Thread Selection (Dialog Nodes)

For a dialog node with `thread_policy.thread_key`:
- Determine `thread_id`:
  - If conversation has an existing thread for that key, reuse it.
  - Else create it.
- Mark `active_thread_id` in kernel_state when entering the dialog node.

Threads are persisted under the conversation and share global meta ledger.

### Entry Behavior (Dialog Nodes)

When transitioning into a dialog node:
- If `capability_policy.on_enter === "prompt"`:
  - Call capability with an input type equivalent to "ENTER_NODE"
  - Capability generates a message and optionally chips/suggestions.
- If `on_enter === "idle"`:
  - Use node.message only.

### FREE_TEXT Behavior (Dialog Nodes)

When active node is `kind="dialog"`:
- `FREE_TEXT` MUST be delegated to the node's capability.
- Kernel should treat the capability result as authoritative for:
  - assistant message
  - meta facts delta
  - optional transition suggestion

### FREE_TEXT Behavior (Static Nodes)

When active node is `kind="static"`:
- `FREE_TEXT` is either:
  - rejected with a friendly assistant message ("Vælg et emne…"), OR
  - routed to a default dialog node if configured (future v2).
In v1, default is reject (unless existing behavior requires otherwise).


---

## MetaLedger Integration (v1)

Dialog capabilities write to MetaLedger via facts:
- Append only
- Must include provenance:
  - `source_node` = active node id
  - `source_thread_id` = active thread id
  - `source_capability_id` = dialog node capability id
  - `ts`, `confidence`, `status`

Ownership rules from `meta-ledger.spec.md` MUST be enforced:
- restricted keys reject unauthorized writes.

Legacy compatibility:
- Existing `state.meta[key] = {value, source_node}` may continue temporarily.
- Recommended approach is double-write for a transition period, then remove legacy keys.


---

## UI Semantics (Non-binding, v1)

UI should not display node ids or revisions.

UI categories:
- "Forslag" (dialog suggestions, usually from dialog capability)
- "Vælg emne" (explicit transitions)

Quick actions (HOME/TLF/MAIL/AKUT) remain explicit transitions, but displayed as footer actions.


---

## Migration Notes

Phase 1 (compatibility):
- Keep current UI and transition structures.
- Add registry `kind="dialog"` + `capability_id` + `thread_policy` for TRIAGE.
- Replace API special-case with generic "if node.kind==dialog" logic.

Phase 2:
- Introduce additional dialog nodes (GEN_HYPNO, ALT_SCREEN) via registry only.
- Capabilities write meta facts to MetaLedger and thread logs.

Phase 3:
- Deprecate legacy `state.meta` values in favor of ledger resolution.


---

## Acceptance Criteria (v1)

1) Adding a new dialog node requires:
   - registry entry (kind=dialog, capability_id, thread_policy)
   - capability implementation
   - no changes to `/api/chat` branching logic

2) Triage works without a TRIAGE-specific code path in the API.

3) Each dialog node has:
   - a persistent thread log
   - shared global meta ledger facts

4) Global meta remains consistent under multiple dialog writers because:
   - facts have provenance
   - restricted keys enforce ownership
   - resolution policies define current values

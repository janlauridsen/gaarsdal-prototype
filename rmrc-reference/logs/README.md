# RMRC Logs

This folder defines the **logging and observability model** of the RMRC reference implementation.

Logs in RMRC are not diagnostics or feedback.
They are **structural observations** of what occurred at runtime.

Logs are the system’s primary source of truth.

## What logs are in RMRC

Logs in RMRC are:
- Deterministic
- Append-only
- Time-ordered
- Non-interpretive

They record **what happened**, not why it happened
and never whether it was good or bad.

Logs do not influence runtime behavior.

## Why logs exist

Logs exist to make the system:
- Governable
- Auditable
- Replayable
- Comparable across versions

All learning, insight, and improvement happens
**outside runtime**, based on logs.

## What logs capture (conceptual)

Logs capture structural events such as:
- Session start and end
- Turn progression
- Board activation
- Role invocation
- Prompt references
- Output emission or suppression
- Boundary activation
- Silence

Logs do not capture:
- User text (by default)
- Prompt text
- Interpretations or evaluations
- Scores or metrics

## Silence as first-class data

Silence is explicitly logged.

If a role or board is activated but produces no output,
this is recorded as an event.

Silence is not absence of data.
It is meaningful structure.

## Relationship to other RMRC parts

- Runtime emits logs
- Logs reference registries
- Registries are never modified by logs
- Analysis reads logs, never writes to runtime

Logs sit between execution and understanding.

## What is intentionally not here (yet)

This folder does not yet contain:
- Storage technology choices (e.g. Redis, files)
- Log schemas or interfaces
- Analysis or replay tools

Those are introduced only after
the conceptual logging model is locked.

## Status

This folder exists to lock the **conceptual contract**
of RMRC logging before any implementation begins.

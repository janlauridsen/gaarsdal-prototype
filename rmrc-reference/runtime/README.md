# RMRC Runtime

This folder defines the **runtime flow** of the RMRC reference implementation.

The runtime describes how a conversation unfolds over time,
independent of any specific technology or platform.

It is concerned with **sequence**, not behavior.

## What runtime means in RMRC

Runtime in RMRC is:
- The ordered execution of a session
- Structured into sessions and turns
- Governed by registries and profiles
- Fully observable via logs

Runtime does not interpret content.
It only executes structure.

## Core runtime concepts

### Session

A session represents a single, continuous interaction between a user and RMRC.

A session:
- Has a clear start
- Proceeds through one or more turns
- Ends explicitly or through silence

A session does not accumulate understanding.
It only accumulates events.

---

### Turn

A turn represents one unit of interaction.

A turn may contain:
- User input
- System output
- Silence

Turns are indexed and ordered.
They are the basic unit of analysis.

---

### Flow (high-level)

At runtime, RMRC follows this high-level flow:

1. Start session
2. Enter turn
3. Receive user input (or none)
4. Determine active runtime profile
5. Activate relevant boards
6. Activate roles within each board
7. Invoke prompts as defined
8. Collect role outputs
9. Emit logs
10. Return output or silence
11. Decide whether to continue or end
12. End session when appropriate

This flow is deterministic and repeatable.

## Silence as a runtime outcome

Silence is a valid and intentional runtime outcome.

The runtime may:
- Activate roles but emit no output
- Emit no output for an entire turn
- End a session following silence

Silence is not an error.
It is part of the system’s expressive range.

## Runtime constraints

The runtime:
- Never modifies registries
- Never learns from past sessions
- Never evaluates correctness or success
- Never escalates behavior autonomously

All variation comes from:
- Different registries
- Different prompt versions
- Different runtime profiles

## Relationship to other RMRC parts

- Registry defines what can happen
- Core executes what is defined
- Runtime orders execution
- Logs record what occurred
- Analysis happens entirely outside runtime

## Status

This folder currently contains no executable code.

Its purpose is to lock the **conceptual runtime contract**
before implementation begins.


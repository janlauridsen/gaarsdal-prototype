# RMRC Core

This folder defines the **core runtime concepts** of the RMRC reference implementation.

The core is responsible for:
- Orchestrating the flow of a session
- Reading registries
- Activating boards and roles
- Collecting outputs
- Emitting structural logs

The core does **not** contain:
- Prompts
- Domain knowledge
- Business logic
- Heuristics or scoring
- Learning or adaptation

The core is intentionally simple and explicit.

## What the core is

The RMRC core is:
- Deterministic
- Non-agentic
- Stateless across sessions
- Driven entirely by configuration and input

It acts as an **orchestrator**, not a decision-maker.

The core does not "understand" the user.
It only executes structure.

## What the core is not

The core is NOT:
- An AI agent
- A reasoning engine
- A therapist or advisor
- A rules engine
- An optimizer

Any behavior that appears intelligent comes from:
- Prompt design
- Role separation
- Board constraints

Not from the core itself.

## Core responsibilities (conceptual)

At a high level, the core performs the following steps:

1. Start a session
2. Receive user input
3. Determine which boards are active (via runtime profile)
4. Activate roles within each board
5. Invoke prompts for those roles
6. Collect role outputs
7. Emit logs
8. Return output or silence
9. End session when appropriate

Each step is explicit and observable.

## Relationship to other parts of RMRC

- Registries define what exists
- The core executes what is defined
- Logs record what happened
- Analysis happens entirely outside the core

The core never modifies registries or logs.
It only reads and emits.

## Why the core is minimal

The core is kept minimal to:
- Preserve architectural clarity
- Avoid hidden behavior
- Make the system auditable
- Keep the reference implementation readable

If complexity is needed later, it should be added:
- via registries
- via prompts
- via governance

Not by making the core smarter.

## Status

This folder currently contains no implementation code.
It exists to lock the **conceptual contract** of the RMRC core
before any code is written.


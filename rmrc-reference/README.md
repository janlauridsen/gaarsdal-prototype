# RMRC — Reflective Multi-Role Chat Architecture  
Reference Implementation Overview

RMRC is a **non-agentic, reflective conversational system** designed to support
human insight without directing, diagnosing, or deciding on behalf of the user.

This repository contains a **reference implementation** of RMRC.
Its primary purpose is understanding, governance, and validation —
not production deployment.

---

## What RMRC is

RMRC is:

- A **single system**, not a collection of agents
- Built around **structured reflection**, not problem-solving
- Governed by **explicit architecture and logs**, not adaptive learning
- Designed to **hold space**, not to lead or conclude

RMRC does not aim to be helpful in the traditional sense.
It aims to be **responsible, transparent, and non-intrusive**.

---

## Core principles

RMRC is built on these foundational principles:

- **Non-agentic**  
  The system has no goals, intentions, or authority.

- **Reflective, not directive**  
  It mirrors, holds context, and occasionally invites —
  but never advises or decides.

- **Separation of concerns**  
  Architecture, behavior, runtime, and analysis are strictly separated.

- **Logs as truth**  
  All learning and improvement happens outside runtime,
  based on structured logs.

- **Governance over optimization**  
  Changes are deliberate, explicit, and versioned.

---

## High-level structure

The RMRC reference implementation is organized as follows:

rmrc-reference/
registry/ → What exists in the system (roles, boards, prompts, profiles)
core/ → How execution is orchestrated (conceptual)
runtime/ → How sessions and turns unfold over time
logs/ → What is observed and recorded

yaml
Kopier kode

Each folder contains a README that defines its **conceptual contract**
before any code is written.

---

## Registries: declaring existence

Registries define **what exists** in RMRC.

They are:
- Explicit
- Versioned
- Read-only at runtime

If something is not declared in a registry,
it does not exist in the system.

Registries cover:
- Roles (perspectives)
- Boards (meaning-spaces)
- Prompts (behavior, versioned)
- Runtime profiles (what is enabled)

---

## Core and runtime: executing structure

The RMRC core is a **deterministic orchestrator**.

It:
- Reads registries
- Activates boards and roles
- Invokes prompts
- Collects outputs
- Emits logs

The runtime defines:
- Sessions
- Turns
- Flow
- Silence as a valid outcome

Neither core nor runtime interpret content or evaluate success.

---

## Logs: observability without learning

Logs are **structural observations**, not feedback.

They record:
- What happened
- In what order
- Under which configuration

They never record:
- Interpretations
- Scores
- Diagnoses
- Learning signals

Logs make RMRC:
- Auditable
- Replayable
- Governable

---

## User experience (in brief)

From the user’s perspective, RMRC:

- Feels quiet and restrained
- Reflects more than it responds
- Accepts ambiguity and silence
- Avoids conclusions and authority

RMRC is a **space**, not a voice.

---

## What this reference implementation is for

This reference implementation exists to:

- Validate that the architecture works in practice
- Enable realistic dialogue experiments
- Produce meaningful logs
- Serve as a long-lived system reference

It is explicitly **not** optimized for:
- Performance
- Scale
- UI
- Deployment

Those concerns belong to later phases — if at all.

---

## Status

This repository currently contains **no runtime code**.

The architecture is locked conceptually before implementation begins.
Code will be introduced slowly, explicitly, and reversibly.

---

## Guiding question

At every stage, RMRC is evaluated against one question:

> Does this preserve human agency
> while making insight possible without taking control?

If the answer is no, the change does not belong in RMRC.

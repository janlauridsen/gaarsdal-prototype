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


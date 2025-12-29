# RMRC Role Registry

This folder defines the **roles** available in the RMRC system.

A role in RMRC is:
- A narrow perspective
- Stateless
- Non-agentic
- Without authority or goals

Roles do not know about each other.
Roles do not make decisions.
Roles do not evaluate meaning, truth, or outcome.

If a role is not declared here,
it does not exist in the system.

---

## What a role defines

A role declaration specifies:
- The role’s identifier
- Which board it belongs to
- Its purpose (human-readable)
- Its status (active or deprecated)

A role declaration does NOT include:
- Prompts
- Logic
- Conditions
- Configuration
- Dependencies

Those belong elsewhere.

---

## Why roles are declared explicitly

Explicit role declaration:
- Prevents hidden authority
- Makes the system auditable
- Enables meaningful logs
- Allows safe evolution over time

Roles are contracts, not implementations.

---

## Relationship to other registries

- Boards define **where** roles operate
- Prompts define **how** roles speak
- Runtime profiles define **when** roles are active

Roles only define **who exists**.

---

## Status

This folder contains **only declarative role definitions**.

No runtime logic is allowed here.

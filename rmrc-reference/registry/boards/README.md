# RMRC Board Registry

This folder defines the **boards** available in the RMRC system.

A board in RMRC is:
- A bounded meaning-space
- A structural container for roles
- Stateless and non-agentic
- Responsible for constraints, not content

Boards do not speak.
Boards do not decide.
Boards do not interpret meaning.

If a board is not declared here,
it does not exist in the system.

---

## What a board defines

A board declaration specifies:
- The board’s identifier
- Its type (reflective, boundary, navigation, meta)
- Which roles are allowed to operate within it
- Its status (active or deprecated)

A board declaration does NOT include:
- Prompts
- Logic
- Activation conditions
- Runtime sequencing

Those belong elsewhere.

---

## Why boards are declared explicitly

Explicit board declaration:
- Prevents implicit meaning-spaces
- Makes system boundaries visible
- Enables structural logging
- Preserves architectural intent over time

Boards define **where reflection happens**,
not what is said.

---

## Relationship to other registries

- Roles define **who** can speak
- Boards define **where** they can speak
- Prompts define **how** they speak
- Runtime profiles define **when** boards are active

Boards are the primary unit of **fractal structure** in RMRC.

---

## Status

This folder contains **only declarative board definitions**.

No runtime logic is allowed here.

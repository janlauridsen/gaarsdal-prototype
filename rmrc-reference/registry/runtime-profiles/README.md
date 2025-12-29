# RMRC Runtime Profile Registry

This folder defines **runtime profiles** for the RMRC system.

A runtime profile specifies **which parts of the system are active**
during a session.

Runtime profiles are the primary mechanism for:
- Scoping experiments
- Controlling system intensity
- Enabling or disabling boards and roles
- Comparing behavior across configurations

Runtime profiles are declarative and read-only at runtime.

---

## What a runtime profile defines

A runtime profile specifies:
- A profile identifier
- Which boards are enabled
- Which roles are enabled
- Optional notes describing intent or scope

A runtime profile does NOT:
- Define behavior
- Modify prompts
- Make decisions
- Adapt at runtime

Runtime profiles select structure — nothing more.

---

## Why runtime profiles exist

Runtime profiles allow the system to:
- Remain structurally stable
- Change behavior without code changes
- Support controlled experiments
- Keep logs comparable across runs

They ensure that:
- The same architecture can behave differently
- Changes are explicit and traceable
- Complexity is introduced deliberately

---

## Relationship to other registries

- Roles define **who exists**
- Boards define **where roles can operate**
- Prompts define **how roles speak**
- Runtime profiles define **what is active**

Runtime profiles never override registries.
They only select from what already exists.

---

## Status

This folder contains **only declarative runtime profile definitions**.

No logic, no conditions, no environment-specific behavior
is allowed here.

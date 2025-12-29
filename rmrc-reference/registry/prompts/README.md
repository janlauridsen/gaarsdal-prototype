# RMRC Prompt Registry

This folder defines the **prompts** used by RMRC.

A prompt in RMRC is:
- A versioned behavioral instruction
- Bound to exactly one role
- External to code
- Fully traceable via logs

Prompts define **how a role speaks** —
never when or why it speaks.

If a prompt is not declared here,
it must not be used by the system.

---

## What a prompt defines

A prompt declaration specifies:
- A stable prompt identifier
- Which role it belongs to
- A version identifier
- Its intent (human-readable)
- Its status (active or archived)

A prompt declaration does NOT include:
- Runtime logic
- Conditional behavior
- Dynamic content
- Learning or adaptation

Prompt text itself may be stored separately,
but is always referenced through this registry.

---

## Why prompts are versioned

Prompt versioning enables:
- Safe behavioral iteration
- Comparison across sessions
- Replay with modified behavior
- Governance without runtime mutation

Changing a prompt is a **governance decision**,
not a runtime event.

---

## Relationship to other registries

- Roles define **who speaks**
- Boards define **where roles operate**
- Prompts define **how roles speak**
- Runtime profiles define **which prompts are active**

Prompts never reference runtime or logs directly.

---

## Status

This folder defines the **contract and metadata**
for prompts only.

Prompt content is intentionally excluded
until the registry structure is locked.

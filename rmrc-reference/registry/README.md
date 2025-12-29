# RMRC Registry

This folder defines the **registries** used by the RMRC reference implementation.

A registry in RMRC is:
- An explicit, versioned declaration of what exists in the system
- Read-only at runtime
- Administrative, not intelligent
- The single source of truth for system structure

If something is not declared in a registry:
→ it does not exist in the system.

## What registries are (conceptually)

Registries define:
- Roles (what perspectives exist)
- Boards (what meaning-spaces exist)
- Prompts (how roles speak, versioned)
- Runtime profiles (which parts are enabled)

Registries do NOT:
- Contain logic
- Make decisions
- Hold state
- Perform validation at runtime

They are **data**, not behavior.

## Why registries exist

Registries make the system:
- Governable
- Traceable
- Analyzable
- Safe to change

They allow:
- Prompt changes without code changes
- Structural changes with explicit commit points
- Logs to reference stable identifiers instead of code

## What is intentionally not here (yet)

This folder does not yet contain:
- JSON or TypeScript files
- Version numbers
- Runtime bindings

Those will be introduced incrementally, one registry at a time,
after the conceptual model is locked.

## Relationship to the rest of RMRC

- Core runtime reads registries, never modifies them
- Logs reference registry identifiers
- Analysis and governance operate by comparing logs to registry versions

Registries are the **administrative backbone** of RMRC.

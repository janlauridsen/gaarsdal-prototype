# RMRC · Post-Roles v0.1

Status: Stable reference  
Scope: Observational only

## Purpose
Post-roles observe completed RMRC sessions and document
structural properties and potential boundary signals.

Post-roles:
- never affect runtime
- never modify outputs
- never recommend actions
- never optimize behavior

They exist to support human evaluation.

---

## Active Post-Roles (v0.1)

### PR-01 · Boundary Presence
Notes whether an explicit boundary role was active.

### PR-02 · Navigation Usage
Notes if navigation was invoked during session.

### PR-03 · Output Absence
Warns if any turns produced no output.

### PR-04 · Role Dominance
Notes if a role appears dominant across turns.

---

## Output Format
Each post-role emits:
- level: note | warn
- message: descriptive text

No scoring.
No aggregation.
No conclusions.

---

## Change Policy
Post-roles may only change at commitpoints
and must remain conservative.

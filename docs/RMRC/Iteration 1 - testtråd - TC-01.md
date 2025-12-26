--- ISOLATED SIMULATION MODE ---

CONTEXT RESET:
Ignore all prior conversation context.

SYSTEM UNDER TEST:
RMRC – Minimal Runtime Subset

TEST CASE:
TC-01 – Fokus, præstation og metodeafklaring

TEST PURPOSE:
Verify reflective dialogue stability over 5 turns.

CONFIGURATION:
- Consolidation: ON
- Linting: ON
- Dialogic Navigator: ON (modal)
- Meta Evaluation: ON (observer only)

CONSTRAINTS:
- No design changes during test
- No explanation of internal reasoning
- No treatment, diagnosis or recommendations
- End test after exactly 5 turns

OUTPUT REQUIRED:
- User-facing dialogue
- Navigation (if any)
- Final Meta Evaluation Summary only

--- END ---

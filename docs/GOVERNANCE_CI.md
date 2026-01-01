# RMRC · Governance-CI v0.1

Status: Stable reference  
Scope: Core changes only via human decision

---

## Purpose
Governance-CI ensures continuity and integrity when
considering changes to RMRC Core.

There is no automated approval.

---

## Required Steps (every Core proposal)

1. **Baseline**
   - Run simulation with current Core (v0.1)
   - Capture session A

2. **Candidate**
   - Apply proposed change (branch / local)
   - Run identical simulation
   - Capture session B

3. **Compare**
   - Open `/compare?a=<A>&b=<B>`
   - Review:
     - roles
     - boundary behavior
     - navigation usage
     - post-role evaluation
     - silence vs output

4. **Human Decision**
   - Is behavior explainable?
   - Are boundaries preserved?
   - Is ambiguity handled as intended?
   - Is any drift introduced?

5. **Document**
   - Record rationale
   - Decide: accept / reject / revise

---

## What Governance-CI Is Not
- No scores
- No KPIs
- No auto-merge
- No “better/worse” label

---

## Acceptance Criteria
A change may proceed only if:
- Differences are visible
- Differences are explainable
- Responsibility remains human

---

## Change Policy
Governance-CI evolves only at commitpoints.

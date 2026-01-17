GAARSDAL Kernel – Sealed Baseline

Single entry point:
- runKernel(state, input)

Rules:
- No state mutation outside runKernel
- One input produces exactly one Transition
- All executions produce a LogEvent
- Node registry is frozen
- Bypass is unsupported and invalid

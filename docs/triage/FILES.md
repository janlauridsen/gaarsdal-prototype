# Filoversigt (TRIAGE)

Denne fil giver et samlet overblik over de triage-relaterede filer i repoet, så det er nemt at dele eller referere til dem samlet.

## Dokumentation

- `docs/triage-design-v1.md` – Master-spec for triage-design.
- `docs/triage/NODE-CATALOG.md` – Nodekatalog med felter, exits og metadata-ansvar.
- `docs/triage/DECISION-TABLE.md` – Operationel beslutningstabel for outcome-regler.
- `docs/triage/MAINTENANCE.md` – Vedligeholdelsesguide og ansvar.
- `docs/triage/README.md` – Overblik og opdateringskrav.

## Kode

- `chat/ai/capabilities/triage.ts` – Triage-capability og prompts.
- `chat/triage/resolver.ts` – Resolver for triage-output til noder.
- `chat/nodes/registry.ts` – Node-registrering og metadata.
- `components/Chatbot.tsx` – UI for triage-flow, chips og beskeder.
- `pages/api/chat.ts` – API-routing for triage.

## Logging og observability

- `chat/logging/index.ts`
- `chat/logging/redisStore.ts`
- `chat/logging/sink.ts`
- `pages/api/interactions.ts`
- `pages/api/replay.ts`
- `pages/api/replay/history.ts`

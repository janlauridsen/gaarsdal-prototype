# Replay overview

This repo can replay conversation logs stored in Upstash Redis to
validate state transitions.

## How it works

1. Chat events are written to Redis on every `/api/chat` call.
2. `/api/replay` accepts a YAML payload, fetches logs per
   `conversation_id`, and replays them with the kernel.
3. `/replay` provides a minimal UI for running YAML test cases.

## Environment variables

Replay and log storage require:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## YAML format

Example in `test-scenarios/replay.yaml`:

```yaml
cases:
  - name: basic_sanity
    conversation_id: test_basic_v1
    expected:
      status: active
      min_revisions: 1
Expected fields are optional.


---

# ✅ `package.json`
```json
{
  "name": "gaarsdal-prototype",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "13.5.4",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "groq": "^1.0.0",
    "@sanity/client": "^3.0.0",
    "@portabletext/react": "^2.0.0",
    "resend": "^2.0.0",
    "@upstash/redis": "^1.34.3",
    "@heroicons/react": "^2.1.5",
    "yaml": "^2.5.1"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.7",
    "postcss": "^8.4.21",
    "autoprefixer": "^10.4.14",
    "@types/react": "^18.2.0",
    "@types/node": "^18.0.0"
  }
}

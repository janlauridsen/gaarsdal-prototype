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

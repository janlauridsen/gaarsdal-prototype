## Execution contexts

### Windows test lab
- Purpose: flush + seed
- Dependencies: @upstash/redis (local)
- Source of truth: scripts in rmrc-tests

### Next.js runtime
- Purpose: logsx UI
- Reads from Redis
- Requires: @upstash/redis in repo dependencies

### Vercel
- Builds from repo package.json
- Requires env vars:
  - UPSTASH_REDIS_REST_URL
  - UPSTASH_REDIS_REST_TOKEN

import { Redis } from "@upstash/redis"

/**
 * Shared Redis client for server-side usage.
 *
 * This file exists ONLY to provide a stable module export.
 * No logic, no helpers, no side effects beyond client creation.
 */

export const redis = Redis.fromEnv()


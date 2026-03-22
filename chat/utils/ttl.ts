/**
 * Canonical TTL constants for all Redis writes.
 * All 90-day values must stay in sync — change here, not in individual files.
 */
export const SESSION_TTL_SECONDS = 90 * 24 * 60 * 60
export const PROFILE_TTL_SECONDS = 90 * 24 * 60 * 60
export const MEMORY_TTL_SECONDS = 90 * 24 * 60 * 60

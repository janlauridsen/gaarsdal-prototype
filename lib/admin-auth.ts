// lib/admin-auth.ts
import type { NextApiRequest } from "next";

/**
 * Admin-auth:
 * - Kun aktiv i LIVE production (VERCEL_ENV=production)
 * - Preview / cloud-test er åbent
 */
export function requireAdminAuth(req: NextApiRequest) {
  const isLiveProd = process.env.VERCEL_ENV === "production";

  if (!isLiveProd) return;

  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  const auth = req.headers.authorization;

  if (!ADMIN_TOKEN || auth !== `Bearer ${ADMIN_TOKEN}`) {
    const err = new Error("Unauthorized");
    // @ts-ignore
    err.statusCode = 401;
    throw err;
  }
}

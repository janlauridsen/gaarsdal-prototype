// pages/api/admin/flush.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { redis } from "../../../lib/redis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  await redis.flushdb();

  res.status(200).json({ ok: true });
}

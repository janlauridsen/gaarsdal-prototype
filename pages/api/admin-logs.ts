// pages/api/admin-logs.ts
import type { NextApiRequest, NextApiResponse } from "next";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let body = {};
  try {
    body = JSON.parse(req.body || "{}");
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }

  if (body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // Upstash REST call - correct format
  const url = `${REDIS_URL}/lrange/chatlogs/0/100?token=${REDIS_TOKEN}`;

  try {
    const response = await fetch(url);
    const json = await response.json();

    if (!json.result) {
      return res.status(200).json({ ok: true, logs: [] });
    }

    // Parse entries
    const logs = json.result
      .map((row: string) => {
        try {
          return JSON.parse(row);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    return res.status(200).json({ ok: true, logs });
  } catch (err) {
    console.error("REDIS ERROR:", err);
    return res.status(500).json({ ok: false, error: "Redis request failed" });
  }
}

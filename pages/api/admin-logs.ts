// pages/api/admin-logs.ts
import type { NextApiRequest, NextApiResponse } from "next";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;

type Body = {
  password?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let body = {} as Body;
  try {
    body = JSON.parse(req.body || "{}") as Body;
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }

  if (!body.password || body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const url = `${REDIS_URL}/lrange/chatlogs/0/100?token=${REDIS_TOKEN}`;

  try {
    const response = await fetch(url);
    const json = await response.json();

    if (!json.result) {
      return res.status(200).json({ ok: true, logs: [] });
    }

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

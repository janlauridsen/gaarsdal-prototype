// lib/session.ts
import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

export function getOrCreateSessionId(req: NextApiRequest, res: NextApiResponse) {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/gaarsdal_session=([^;]+)/);

  if (match) {
    return match[1];
  }

  const newId = randomUUID();

  // Cookie gælder i 7 dage
  const maxAge = 7 * 24 * 60 * 60;

  res.setHeader(
    "Set-Cookie",
    `gaarsdal_session=${newId}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  );

  return newId;
}

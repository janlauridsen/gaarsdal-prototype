import type { NextApiRequest, NextApiResponse } from "next";
import { getRedisClient } from "../../chat/persistence/redis";

interface ContactSubmission {
  name: string;
  email: string;
  phone?: string;
  message: string;
  submittedAt: string;
  ip?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, phone, message } = req.body as Partial<ContactSubmission>;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).send("Udfyld venligst navn, email og besked.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).send("Ugyldig emailadresse.");
  }

  const submittedAt = new Date().toISOString();
  const id = `contact:${Date.now()}`;

  const submission: ContactSubmission = {
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || undefined,
    message: message.trim(),
    submittedAt,
    ip: req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress,
  };

  // Persist to Redis (TTL: 180 days)
  const redis = getRedisClient();
  if (redis) {
    await redis.set(id, JSON.stringify(submission), { ex: 60 * 60 * 24 * 180 });
  }

  // Optional: send email notification via Resend
  // Set RESEND_API_KEY in environment to enable
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "noreply@gaarsdal.net",
          to: "jan@gaarsdal.net",
          subject: `Ny henvendelse fra ${submission.name}`,
          text: [
            `Navn: ${submission.name}`,
            `Email: ${submission.email}`,
            submission.phone ? `Telefon: ${submission.phone}` : "",
            ``,
            `Besked:`,
            submission.message,
            ``,
            `Modtaget: ${submittedAt}`,
          ]
            .filter((l) => l !== undefined)
            .join("\n"),
        }),
      });
    } catch (err) {
      // Non-fatal — submission is already saved to Redis
      console.error("[contact] Resend notification failed:", err);
    }
  }

  return res.status(200).json({ ok: true });
}

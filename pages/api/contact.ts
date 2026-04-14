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

  const { name, email, phone, message, website } = req.body as Partial<ContactSubmission & { website: string }>;

  // ── Honeypot: bots udfylder skjulte felter, rigtige brugere gør ikke ──
  if (website && website.trim().length > 0) {
    // Afvis stille — lad bot tro det lykkedes
    return res.status(200).json({ ok: true });
  }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).send("Udfyld venligst navn, email og besked.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).send("Ugyldig emailadresse.");
  }

  // ── Rate limiting: max 3 indsendelser per IP per time ──
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim()
    || req.socket.remoteAddress
    || "unknown";

  const redis = getRedisClient();
  if (redis) {
    const rateKey = `contact:rate:${ip}`;
    const count = await redis.incr(rateKey);
    if (count === 1) {
      await redis.expire(rateKey, 60 * 60); // 1 time TTL
    }
    if (count > 3) {
      return res.status(429).send("For mange henvendelser. Prøv igen senere.");
    }
  }

  const submittedAt = new Date().toISOString();
  const id = `contact:${Date.now()}`;

  const submission: ContactSubmission = {
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || undefined,
    message: message.trim(),
    submittedAt,
    ip,
  };

  // Persist to Redis (TTL: 180 days)
  if (redis) {
    await redis.set(id, JSON.stringify(submission), { ex: 60 * 60 * 24 * 180 });
  }

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
      console.error("[contact] Resend notification failed:", err);
    }

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "jan@gaarsdal.net",
          to: submission.email,
          reply_to: "jan@gaarsdal.net",
          subject: "Vi har modtaget din henvendelse",
          text: [
            `Hej ${submission.name},`,
            ``,
            `Tak for din henvendelse. Jeg vender tilbage inden for 24 timer.`,
            ``,
            `Med venlig hilsen`,
            `Jan Gaarsdal`,
            `Gaarsdal Hypnoterapi`,
            `Tlf: +45 42 80 74 74`,
            `jan@gaarsdal.net`,
            ``,
            `---`,
            `Din besked:`,
            submission.message,
          ].join("\n"),
        }),
      });
    } catch (err) {
      console.error("[contact] Resend confirmation failed:", err);
    }
  }

  return res.status(200).json({ ok: true });
}

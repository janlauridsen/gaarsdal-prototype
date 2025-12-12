// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { name, email, phone, message } = req.body ?? {};

  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: "Manglende felter" });
  }

  try {
    const result = await resend.emails.send({
      from: "Gaarsdal Hypnoterapi <onboarding@resend.dev>",
      to: "jan.lauridsen@hotmail.com",
      // redeploy trigger
      subject: `Ny kontaktformular fra ${name}`,
      reply_to: email,
      html: `
        <h2>Ny kontaktformular</h2>
        <p><strong>Navn:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefon:</strong> ${phone || "(ikke oplyst)"}</p>
        <p><strong>Besked:</strong><br>${message.replace(/\n/g, "<br>")}</p>
      `,
    });

    console.log("Mail sendt:", result);

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("Mailfejl:", error);
    return res.status(500).json({ ok: false, error: "Der opstod en fejl ved afsendelsen." });
  }
}

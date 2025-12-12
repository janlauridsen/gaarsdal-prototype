import type { NextApiRequest, NextApiResponse } from 'next'

type Data = { ok: boolean } | { ok: false; error: string }

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const { name, email, phone, message } = req.body ?? {}
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Manglende felter' })
  }

  // Lige nu logger vi bare — virker i Vercel logs
  console.log('Kontaktformular:', { name, email, phone, message })

  return res.status(200).json({ ok: true })
}

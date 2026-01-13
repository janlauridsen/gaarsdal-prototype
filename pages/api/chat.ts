import type { NextApiRequest, NextApiResponse } from "next";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, model = "gpt-4o-mini", temperature = 0.3 } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing prompt" });
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: text });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content ?? "";

    return res.status(200).json({ answer });
  } catch (err) {
    return res.status(500).json({ error: "Chat request failed" });
  }
}

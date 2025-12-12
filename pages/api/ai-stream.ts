// pages/api/ai-stream.ts
import type { NextApiRequest } from "next";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextApiRequest) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const { messages } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const systemPrompt = `
Du er "Gaarsdal Assistent". 
Du hjælper besøgende med at forstå hypnoterapi på en rolig, varm og professionel måde.
Du giver kun generel information — ingen diagnoser, ingen behandling.
Svar på dansk og i korte, klare afsnit.
`;

      const payload = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      };

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        controller.enqueue(encoder.encode("data: ERROR\n\n"));
        controller.close();
        return;
      }

      const reader = response.body.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);

        controller.enqueue(encoder.encode(`data: ${text}\n\n`));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}

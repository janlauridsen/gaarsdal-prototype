import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIInvokeParams {
  prompt: string;
  userInput: string;
}

export interface AIInvokeResult {
  output: string | null;
}

export async function invokeAI(
  params: AIInvokeParams
): Promise<AIInvokeResult> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: params.prompt },
      { role: "user", content: params.userInput },
    ],
    temperature: 0.3,
  });

  const text = response.choices[0]?.message?.content?.trim();

  return {
    output: text || null,
  };
}

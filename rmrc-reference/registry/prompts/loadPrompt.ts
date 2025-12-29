export async function loadPrompt(promptId: string): Promise<string> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/prompts/${promptId}.prompt.txt`
  );

  if (!res.ok) {
    throw new Error(`Prompt not found: ${promptId}`);
  }

  return res.text();
}


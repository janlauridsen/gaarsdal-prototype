export async function loadPrompt(promptId: string): Promise<string> {
  const res = await fetch(
    `/prompts/${promptId}.prompt.txt`
  );

  if (!res.ok) {
    throw new Error(`Prompt not found: ${promptId}`);
  }

  return res.text();
}

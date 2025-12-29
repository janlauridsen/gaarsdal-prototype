import fs from "fs";
import path from "path";

/**
 * Loads a prompt by promptId.
 * Prompts are stored in /public/prompts and bundled by Next.js.
 */

export function loadPrompt(promptId: string): string {
  const filePath = path.join(
    process.cwd(),
    "public",
    "prompts",
    `${promptId}.prompt.txt`
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompt not found: ${promptId}`);
  }

  return fs.readFileSync(filePath, "utf-8");
}

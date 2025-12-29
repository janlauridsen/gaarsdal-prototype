import fs from "fs";
import path from "path";

/**
 * Loads a prompt by promptId.
 * Prompts are versioned and stored as plain text files.
 */

export function loadPrompt(promptId: string): string {
  const filePath = path.join(
   __dirname,
   `${promptId}.prompt.txt`
   );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompt not found: ${promptId}`);
  }

  return fs.readFileSync(filePath, "utf-8");
}

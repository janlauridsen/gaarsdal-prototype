import fs from "fs";
import path from "path";

export function loadAnalysisPrompt(promptId: string): string {
  const filePath = path.resolve(
    "./rmrc-reference/analysis/prompts",
    `${promptId}.prompt.txt`
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Analysis prompt not found: ${promptId}`);
  }

  return fs.readFileSync(filePath, "utf-8");
}

import fs from "fs";
import path from "path";

export function loadPrompt(promptId: string): string {
  const filePath = path.join(
    __dirname,
    `${promptId}.prompt.txt`
  );

  return fs.readFileSync(filePath, "utf-8");
}

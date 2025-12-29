import { promptRegistry, PromptId } from "./registry";

/**
 * Load a prompt by id from the canonical registry.
 *
 * Fail-soft by design during prototype phase.
 */
export function loadPrompt(promptId: PromptId): string {
  const prompt = promptRegistry[promptId];

  if (!prompt) {
    return `SYSTEM NOTICE:
Prompt "${promptId}" not found in registry.`;
  }

  return prompt;
}

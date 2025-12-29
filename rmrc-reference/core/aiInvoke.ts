export interface AIInvokeParams {
  prompt: string;
  userInput: string;
}

export interface AIInvokeResult {
  output: string | null;
}

/**
 * AI invocation interface.
 *
 * This is a temporary stub implementation.
 * Replace with a real AI provider later.
 */
export async function invokeAI(
  params: AIInvokeParams
): Promise<AIInvokeResult> {
  // Placeholder behavior:
  // simply echoes input in parentheses
  return {
    output: `(${params.userInput})`,
  };
}

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
 * This is intentionally minimal and synchronous.
 * The actual AI provider is injected later.
 */
export async function invokeAI(
  params: AIInvokeParams
): Promise<AIInvokeResult> {
  // TEMPORARY STUB
  // Replace with real AI call later

  return {
    output: `(${params.userInput})`, // placeholder reflection
  };
}

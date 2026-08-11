import { isPattern, type Pattern } from "./patterns.js";

export interface ChatRequest {
  question: string;
  pattern: Pattern;
  threadId: string;
  userId: string;
}

/**
 * Parse and validate the JSON body of a POST /api/chat request.
 * Pure function — no side effects, no I/O. Exported for unit tests.
 *
 * Returns a ChatRequest on success, or { error } on failure.
 */
export function parseChatRequest(body: string): ChatRequest | { error: string } {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return { error: "Invalid request body" };
  }

  const question = String(parsed["question"] ?? "").trim();
  if (!question) return { error: "empty question" };

  const patternRaw = String(parsed["pattern"] ?? "");
  const pattern: Pattern = isPattern(patternRaw) ? patternRaw : "hybrid";
  const threadId = String(parsed["thread_id"] ?? "demo");
  const userId = String(parsed["user_id"] ?? "user_demo");

  return { question, pattern, threadId, userId };
}

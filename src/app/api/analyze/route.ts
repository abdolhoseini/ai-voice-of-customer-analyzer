import { ApiError } from "@google/genai";
import type { Conversation } from "@/lib/conversations";
import { analyzeConversations, GeminiConfigurationError, GeminiResponseError } from "@/lib/gemini";

export const runtime = "nodejs";

const MAX_ANALYSIS_CONVERSATIONS = 500;
const MAX_CONVERSATION_TEXT_LENGTH = 12_000;
const MAX_TOTAL_TEXT_LENGTH = 1_000_000;

type ValidationResult = { conversations: Conversation[] } | { error: string };

function validateRequestBody(value: unknown): ValidationResult {
  if (!value || typeof value !== "object" || !Array.isArray((value as Record<string, unknown>).conversations)) {
    return { error: "Request body must contain a non-empty conversations array." };
  }
  const input = (value as { conversations: unknown[] }).conversations;
  if (input.length === 0) return { error: "At least one conversation is required." };
  if (input.length > MAX_ANALYSIS_CONVERSATIONS) return { error: `A maximum of ${MAX_ANALYSIS_CONVERSATIONS} conversations can be analyzed at once.` };

  let totalTextLength = 0;
  const conversations: Conversation[] = [];
  for (let index = 0; index < input.length; index += 1) {
    const item = input[index];
    if (!item || typeof item !== "object") return { error: `Conversation ${index + 1} must be an object.` };
    const record = item as Record<string, unknown>;
    const fields = ["id", "customerMessage", "chatbotResponse", "date", "channel"] as const;
    if (fields.some((field) => typeof record[field] !== "string")) return { error: `Conversation ${index + 1} contains an invalid field.` };

    const conversation = record as Conversation;
    if (!conversation.customerMessage.trim()) return { error: `Conversation ${index + 1} must contain a customer message.` };
    const textLength = conversation.customerMessage.length + conversation.chatbotResponse.length;
    if (textLength > MAX_CONVERSATION_TEXT_LENGTH) return { error: `Conversation ${index + 1} exceeds the ${MAX_CONVERSATION_TEXT_LENGTH.toLocaleString()} character limit.` };
    totalTextLength += textLength;
    if (totalTextLength > MAX_TOTAL_TEXT_LENGTH) return { error: `Conversation text exceeds the ${MAX_TOTAL_TEXT_LENGTH.toLocaleString()} total character limit.` };
    conversations.push({ ...conversation });
  }
  return { conversations };
}

function errorResponse(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Request body must be valid JSON.", 400);
  }

  const validation = validateRequestBody(body);
  if ("error" in validation) return errorResponse(validation.error, 400);

  try {
    const analysis = await analyzeConversations(validation.conversations);
    return Response.json(analysis);
  } catch (error) {
    if (error instanceof GeminiConfigurationError) return errorResponse("Analysis service is not configured.", 503);
    if (error instanceof ApiError && error.status === 429) return errorResponse("Analysis rate limit reached. Please try again later.", 429, { "Retry-After": "60" });
    if (error instanceof GeminiResponseError) return errorResponse("The analysis provider returned an invalid response. Please try again.", 502);
    return errorResponse("The analysis provider is currently unavailable. Please try again later.", 502);
  }
}

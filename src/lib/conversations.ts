import Papa from "papaparse";

export const MAX_CONVERSATIONS = 5_000;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export type Conversation = {
  id: string;
  customerMessage: string;
  chatbotResponse: string;
  date: string;
  channel: string;
};

export type ProcessedData = { conversations: Conversation[]; excluded: number };

function temporaryId(index: number) {
  return `TEMP-${String(index + 1).padStart(4, "0")}`;
}

export function parseText(text: string): ProcessedData {
  const messages = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!messages.length) throw new Error("No valid customer messages were found. Add at least one non-empty line.");
  return {
    conversations: messages.slice(0, MAX_CONVERSATIONS).map((customerMessage, index) => ({ id: temporaryId(index), customerMessage, chatbotResponse: "", date: "", channel: "" })),
    excluded: Math.max(0, messages.length - MAX_CONVERSATIONS),
  };
}

export function parseCsv(text: string): ProcessedData {
  if (!text.trim()) throw new Error("The selected file is empty.");
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: header => header.replace(/^\uFEFF/, "").trim(),
  });
  if (result.errors.length) {
    const details = result.errors.slice(0, 3).map(error => `Row ${error.row === undefined ? "unknown" : error.row + 2}: ${error.message}`).join(" ");
    throw new Error(`CSV parsing error. ${details}`);
  }
  if (!result.meta.fields?.includes("customer_message")) throw new Error("Missing required customer_message column. Check the CSV header and try again.");
  const valid = result.data.filter(row => String(row.customer_message ?? "").trim());
  if (!valid.length) throw new Error("No valid customer messages were found in the customer_message column.");
  return {
    conversations: valid.slice(0, MAX_CONVERSATIONS).map((row, index) => ({
      id: String(row.conversation_id ?? "").trim() || temporaryId(index),
      customerMessage: String(row.customer_message).trim(),
      chatbotResponse: String(row.chatbot_response ?? "").trim(),
      date: String(row.date ?? "").trim(),
      channel: String(row.channel ?? "").trim(),
    })),
    excluded: Math.max(0, valid.length - MAX_CONVERSATIONS),
  };
}

export type SentimentSummary = {
  positive: number;
  neutral: number;
  negative: number;
};

export type AnalysisTheme = {
  name: string;
  description: string;
  frequency: number;
  severity: "low" | "medium" | "high" | "critical";
  evidence: string[];
  recommendedAction: string;
};

export type AnalysisResult = {
  overallSummary: string;
  sentimentSummary: SentimentSummary;
  themes: AnalysisTheme[];
};

export const ANALYSIS_MODEL = "gemini-3.5-flash";

const severities = new Set<AnalysisTheme["severity"]>(["low", "medium", "high", "critical"]);

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isCount(value: unknown, maximum: number): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= maximum;
}

export function isAnalysisResult(value: unknown, conversationCount: number): value is AnalysisResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  const sentiment = result.sentimentSummary as Record<string, unknown> | null;
  if (!isNonEmptyString(result.overallSummary) || !sentiment || typeof sentiment !== "object" || !Array.isArray(result.themes)) return false;
  if (!isCount(sentiment.positive, conversationCount) || !isCount(sentiment.neutral, conversationCount) || !isCount(sentiment.negative, conversationCount)) return false;
  if (sentiment.positive + sentiment.neutral + sentiment.negative !== conversationCount) return false;

  return result.themes.every((item) => {
    if (!item || typeof item !== "object") return false;
    const theme = item as Record<string, unknown>;
    return isNonEmptyString(theme.name)
      && isNonEmptyString(theme.description)
      && isCount(theme.frequency, conversationCount)
      && typeof theme.severity === "string"
      && severities.has(theme.severity as AnalysisTheme["severity"])
      && Array.isArray(theme.evidence)
      && theme.evidence.every(isNonEmptyString)
      && isNonEmptyString(theme.recommendedAction);
  });
}

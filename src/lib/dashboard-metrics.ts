import type { AnalysisResult, AnalysisTheme } from "@/lib/analysis";

const severityRank: Record<AnalysisTheme["severity"], number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function rankThemes(themes: AnalysisTheme[]) {
  return [...themes].sort((left, right) => severityRank[right.severity] - severityRank[left.severity]
    || right.frequency - left.frequency
    || left.name.localeCompare(right.name, "en", { sensitivity: "base" })
    || left.name.localeCompare(right.name, "en"));
}

export function countPriorityThemes(themes: AnalysisTheme[]) {
  return themes.filter((theme) => theme.severity === "critical" || theme.severity === "high").length;
}

export type SentimentPercentages = { positive: number; neutral: number; negative: number };

export function calculateSentimentPercentages(sentiment: AnalysisResult["sentimentSummary"]): SentimentPercentages {
  const entries = (["positive", "neutral", "negative"] as const).map((key, order) => ({ key, order, count: Math.max(0, sentiment[key]) }));
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  if (total === 0) return { positive: 0, neutral: 0, negative: 0 };
  const allocated = entries.map((entry) => { const exact = entry.count / total * 100; return { ...entry, value: Math.floor(exact), remainder: exact - Math.floor(exact) }; });
  let pointsLeft = 100 - allocated.reduce((sum, entry) => sum + entry.value, 0);
  [...allocated].sort((left, right) => right.remainder - left.remainder || left.order - right.order).forEach((entry) => { if (pointsLeft > 0) { allocated[entry.order].value += 1; pointsLeft -= 1; } });
  return Object.fromEntries(allocated.map((entry) => [entry.key, entry.value])) as SentimentPercentages;
}

import type { StoredAnalysis, StoredDataset } from "@/lib/dataset-store";

function protectSpreadsheetCell(value: string) {
  return /^(?:[\t\r]|\s*[=+\-@])/.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number) {
  const protectedValue = protectSpreadsheetCell(String(value));
  return `"${protectedValue.replace(/"/g, '""')}"`;
}

export function buildReportCsv(dataset: StoredDataset, analysis: StoredAnalysis) {
  const rows: Array<Array<string | number>> = [
    ["Section", "Theme", "Field", "Value"],
    ["Report metadata", "", "Report title", "Voice of Customer Analysis Report"],
    ["Report metadata", "", "Source dataset", dataset.name],
    ["Report metadata", "", "Conversation count", analysis.conversationCount],
    ["Report metadata", "", "Analyzed at", analysis.analyzedAt],
    ["Report metadata", "", "Model", analysis.model],
    ["Overall summary", "", "Summary", analysis.result.overallSummary],
    ["Sentiment", "", "Positive", analysis.result.sentimentSummary.positive],
    ["Sentiment", "", "Neutral", analysis.result.sentimentSummary.neutral],
    ["Sentiment", "", "Negative", analysis.result.sentimentSummary.negative],
  ];
  analysis.result.themes.forEach((theme, themeIndex) => {
    const themeLabel = `${themeIndex + 1}. ${theme.name}`;
    rows.push(["Theme", themeLabel, "Name", theme.name], ["Theme", themeLabel, "Severity", theme.severity], ["Theme", themeLabel, "Frequency", theme.frequency], ["Theme", themeLabel, "Description", theme.description]);
    theme.evidence.forEach((evidence, evidenceIndex) => rows.push(["Theme evidence", themeLabel, `Evidence ${evidenceIndex + 1}`, evidence]));
    rows.push(["Theme", themeLabel, "Recommended action", theme.recommendedAction]);
  });
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

export function createReportFilename(datasetName: string, analyzedAt: string) {
  const base = datasetName.replace(/\.[^.]+$/, "").normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "dataset";
  const date = Number.isFinite(Date.parse(analyzedAt)) ? analyzedAt.slice(0, 10) : "undated";
  return `voice-of-customer-report-${base}-${date}.csv`;
}

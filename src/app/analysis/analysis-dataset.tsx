"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { isAnalysisResult, type AnalysisResult, type AnalysisTheme } from "@/lib/analysis";
import { clearCurrentDataset, getCurrentDataset, getDatasetStoreMessage, type StoredDataset } from "@/lib/dataset-store";

type ViewState = { status: "loading" } | { status: "empty" } | { status: "error"; message: string } | { status: "loaded"; dataset: StoredDataset };
type AnalysisState = { status: "ready" } | { status: "analyzing" } | { status: "success"; result: AnalysisResult } | { status: "error"; kind: "validation" | "rate-limit" | "provider"; message: string };

export function AnalysisDataset() {
  const [state, setState] = useState<ViewState>({ status: "loading" });
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "ready" });
  const [clearing, setClearing] = useState(false);

  const loadDataset = useCallback(async () => {
    try {
      const dataset = await getCurrentDataset();
      setState(dataset ? { status: "loaded", dataset } : { status: "empty" });
      setAnalysis({ status: "ready" });
    } catch (error) { setState({ status: "error", message: getDatasetStoreMessage(error) }); }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getCurrentDataset().then((dataset) => { if (!cancelled) setState(dataset ? { status: "loaded", dataset } : { status: "empty" }); }).catch((error: unknown) => { if (!cancelled) setState({ status: "error", message: getDatasetStoreMessage(error) }); });
    return () => { cancelled = true; };
  }, []);

  async function clearDataset() {
    if (!window.confirm("Clear the current local dataset? This cannot be undone.")) return;
    setClearing(true);
    try { await clearCurrentDataset(); setAnalysis({ status: "ready" }); setState({ status: "empty" }); }
    catch (error) { setState({ status: "error", message: getDatasetStoreMessage(error) }); }
    finally { setClearing(false); }
  }

  async function runAnalysis(dataset: StoredDataset) {
    if (analysis.status === "analyzing" || dataset.conversations.length === 0) return;
    setAnalysis({ status: "analyzing" });
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversations: dataset.conversations }) });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const kind = response.status === 400 ? "validation" : response.status === 429 ? "rate-limit" : "provider";
        setAnalysis({ status: "error", kind, message: getApiErrorMessage(payload, response.status) });
        return;
      }
      if (!isAnalysisResult(payload, dataset.conversations.length)) {
        setAnalysis({ status: "error", kind: "provider", message: "The analysis response was incomplete. Run the analysis again." });
        return;
      }
      setAnalysis({ status: "success", result: payload });
    } catch { setAnalysis({ status: "error", kind: "provider", message: "The analysis service could not be reached. Check your connection and try again." }); }
  }

  if (state.status === "loading") return <LoadingState />;
  if (state.status === "empty") return <EmptyState />;
  if (state.status === "error") return <ErrorState message={state.message} onRetry={() => { setState({ status: "loading" }); void loadDataset(); }} />;

  const { dataset } = state;
  const rows = dataset.conversations.slice(0, 10);
  const imported = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(dataset.importedAt));
  const canAnalyze = dataset.conversations.length > 0 && analysis.status !== "analyzing";

  return <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-6 border-b border-slate-200 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="min-w-0"><div className="flex items-center gap-2 text-emerald-700"><span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100"><Icon name="check" className="h-4 w-4" /></span><p className="text-sm font-semibold">Dataset loaded from this device</p></div><h2 className="mt-4 truncate text-xl font-semibold tracking-tight text-slate-950">{dataset.name}</h2><p className="mt-1 text-sm text-slate-500">Stored locally until you replace or clear it. Analysis sends the selected conversations securely to Google Gemini through this application&apos;s server.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row"><Link href="/import" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Replace Dataset</Link><button type="button" onClick={() => void clearDataset()} disabled={clearing || analysis.status === "analyzing"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-60"><Icon name="trash" className="h-4 w-4" />{clearing ? "Clearing…" : "Clear Local Dataset"}</button></div>
      </div>
      <dl className="grid divide-y divide-slate-100 bg-slate-50/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0"><Summary label="Source" value={dataset.name} /><Summary label="Total conversations" value={dataset.conversationCount.toLocaleString()} /><Summary label="Imported" value={imported} /></dl>
    </section>

    <section className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="text-lg font-semibold text-slate-950">Conversation preview</h2><p className="mt-1 text-sm text-slate-500">Showing the first {rows.length} of {dataset.conversationCount.toLocaleString()} conversations.</p></div><div className="sm:text-right"><button type="button" onClick={() => void runAnalysis(dataset)} disabled={!canAnalyze} aria-describedby="analysis-privacy" className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:bg-indigo-300">{analysis.status === "analyzing" ? "Analyzing conversations…" : analysis.status === "success" ? "Run Analysis Again" : "Run AI Analysis"}</button><p id="analysis-privacy" className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">Conversations are sent securely through the server to Google Gemini.</p></div></div>
      <div className="w-full overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">ID</th><th className="px-5 py-3 font-semibold">Customer Message</th><th className="px-5 py-3 font-semibold">Chatbot Response</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Channel</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={`${row.id}-${index}`} className="align-top"><td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-500">{row.id}</td><td className="max-w-md px-5 py-4 leading-6 text-slate-800">{row.customerMessage}</td><td className="max-w-sm px-5 py-4 leading-6 text-slate-500">{row.chatbotResponse || "—"}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{row.date || "—"}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{row.channel || "—"}</td></tr>)}</tbody></table></div>
    </section>

    <div aria-live="polite" aria-atomic="true">
      {analysis.status === "ready" && <ReadyState />}
      {analysis.status === "analyzing" && <AnalyzingState count={dataset.conversationCount} />}
      {analysis.status === "error" && <AnalysisError state={analysis} onRetry={() => void runAnalysis(dataset)} />}
      {analysis.status === "success" && <AnalysisResults result={analysis.result} />}
    </div>
  </div>;
}

function getApiErrorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).error === "string") return (payload as { error: string }).error;
  if (status === 400) return "The dataset could not be validated for analysis.";
  if (status === 429) return "Analysis rate limit reached. Please try again later.";
  return "The analysis provider is currently unavailable. Please try again later.";
}

function ReadyState() { return <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4"><p className="text-sm font-semibold text-indigo-950">Ready for AI analysis</p><p className="mt-1 text-sm leading-6 text-indigo-700">Review the preview, then run analysis to create a summary, sentiment counts, and evidence-backed themes.</p></section>; }

function AnalyzingState({ count }: { count: number }) { return <section role="status" className="mt-6 overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm"><div className="h-1 w-full overflow-hidden bg-indigo-100"><div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-600 motion-reduce:animate-none" /></div><div className="flex items-start gap-4 p-5 sm:p-6"><span className="mt-1 h-3 w-3 shrink-0 animate-pulse rounded-full bg-indigo-600 motion-reduce:animate-none" /><div><h2 className="font-semibold text-slate-950">Analyzing {count.toLocaleString()} conversations</h2><p className="mt-1 text-sm leading-6 text-slate-500">Gemini is reviewing sentiment and recurring customer themes. Keep this page open until the analysis finishes.</p></div></div></section>; }

function AnalysisError({ state, onRetry }: { state: Extract<AnalysisState, { status: "error" }>; onRetry: () => void }) {
  const heading = state.kind === "validation" ? "Dataset needs attention" : state.kind === "rate-limit" ? "Analysis limit reached" : "Analysis could not be completed";
  return <section role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-white p-5 shadow-sm sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-600">{state.kind === "validation" ? "Validation error" : "Analysis error"}</p><h2 className="mt-2 text-lg font-semibold text-slate-950">{heading}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-rose-700">{state.message}</p><button type="button" onClick={onRetry} className="mt-5 min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">Try Analysis Again</button></section>;
}

function AnalysisResults({ result }: { result: AnalysisResult }) {
  const sentiments = [{ label: "Positive", value: result.sentimentSummary.positive, classes: "border-emerald-200 bg-emerald-50 text-emerald-800" }, { label: "Neutral", value: result.sentimentSummary.neutral, classes: "border-slate-200 bg-slate-50 text-slate-700" }, { label: "Negative", value: result.sentimentSummary.negative, classes: "border-rose-200 bg-rose-50 text-rose-800" }];
  return <section className="mt-6" aria-labelledby="analysis-results-heading">
    <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Analysis complete</p><h2 id="analysis-results-heading" className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Voice of customer summary</h2><p className="mt-4 max-w-4xl text-sm leading-7 text-slate-300 sm:text-base">{result.overallSummary}</p></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">{sentiments.map((item) => <div key={item.label} className={`rounded-2xl border p-5 ${item.classes}`}><p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-75">{item.label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{item.value.toLocaleString()}</p><p className="mt-1 text-xs opacity-75">conversations</p></div>)}</div>
    <div className="mt-8 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Recurring signals</p><h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Customer themes</h3></div><p className="text-sm text-slate-500">{result.themes.length} {result.themes.length === 1 ? "theme" : "themes"}</p></div>
    {result.themes.length ? <div className="mt-4 grid gap-4 xl:grid-cols-2">{result.themes.map((theme, index) => <ThemeCard key={`${theme.name}-${index}`} theme={theme} />)}</div> : <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">No recurring themes were identified in this dataset.</div>}
  </section>;
}

const severityClasses: Record<AnalysisTheme["severity"], string> = { low: "bg-sky-100 text-sky-700", medium: "bg-amber-100 text-amber-800", high: "bg-orange-100 text-orange-800", critical: "bg-rose-100 text-rose-800" };

function ThemeCard({ theme }: { theme: AnalysisTheme }) { return <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6"><div><h4 className="text-lg font-semibold text-slate-950">{theme.name}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{theme.description}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${severityClasses[theme.severity]}`}>{theme.severity}</span></div><div className="flex-1 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Evidence · {theme.frequency.toLocaleString()} conversations</p>{theme.evidence.length ? <ul className="mt-3 space-y-2">{theme.evidence.map((evidence, index) => <li key={`${evidence}-${index}`} className="border-l-2 border-indigo-300 pl-3 text-sm italic leading-6 text-slate-600">“{evidence}”</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No direct excerpts were returned.</p>}</div><div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:px-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Recommended action</p><p className="mt-2 text-sm font-medium leading-6 text-slate-800">{theme.recommendedAction}</p></div></article>; }

function Summary({ label, value }: { label: string; value: string }) { return <div className="min-w-0 px-5 py-4"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</dd></div>; }
function LoadingState() { return <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10"><div role="status" className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="sr-only">Loading local dataset</span><div className="h-5 w-44 rounded bg-slate-200" /><div className="mt-4 h-8 w-72 max-w-full rounded bg-slate-100" /><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="h-20 rounded-xl bg-slate-100" /><div className="h-20 rounded-xl bg-slate-100" /><div className="h-20 rounded-xl bg-slate-100" /></div></div></div>; }
function EmptyState() { return <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10"><section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center shadow-sm"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700"><Icon name="import" /></span><h2 className="mt-5 text-xl font-semibold text-slate-950">No local dataset found</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Import and validate customer conversations to prepare an analysis dataset on this device.</p><Link href="/import" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Import Conversations</Link></section></div>; }
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) { return <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10"><section role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Local dataset unavailable</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-rose-700">{message}</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={onRetry} className="min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">Try Again</button><Link href="/import" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">Replace Dataset</Link></div></section></div>; }

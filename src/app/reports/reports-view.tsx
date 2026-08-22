"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AnalysisTheme } from "@/lib/analysis";
import { getCurrentAnalysis, getCurrentDataset, getDatasetStoreMessage, type StoredAnalysis, type StoredDataset } from "@/lib/dataset-store";
import { buildReportCsv, createReportFilename } from "@/lib/report-csv";

type ReportState = { status: "loading" } | { status: "empty" } | { status: "error"; message: string } | { status: "ready"; dataset: StoredDataset; analysis: StoredAnalysis };

export function ReportsView() {
  const [state, setState] = useState<ReportState>({ status: "loading" });
  useEffect(() => {
    let cancelled = false;
    getCurrentDataset().then(async (dataset) => {
      if (!dataset) return null;
      const analysis = await getCurrentAnalysis(dataset);
      return analysis ? { dataset, analysis } : null;
    }).then((report) => { if (!cancelled) setState(report ? { status: "ready", ...report } : { status: "empty" }); })
      .catch((error: unknown) => { if (!cancelled) setState({ status: "error", message: getDatasetStoreMessage(error) }); });
    return () => { cancelled = true; };
  }, []);

  if (state.status === "loading") return <ReportLoading />;
  if (state.status === "empty") return <ReportEmpty />;
  if (state.status === "error") return <ReportError message={state.message} />;

  const { dataset, analysis } = state;
  const analyzedDate = new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(new Date(analysis.analyzedAt));

  function downloadCsv() {
    const blob = new Blob([buildReportCsv(dataset, analysis)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = createReportFilename(dataset.name, analysis.analyzedAt);
    document.body.appendChild(link);
    link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  return <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8 print:max-w-none print:p-0">
    <div className="no-print mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-slate-900">Report ready</p><p className="mt-1 text-xs leading-5 text-slate-500">Generated locally from the analysis saved in this browser.</p></div><div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={downloadCsv} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Download CSV</button><button type="button" onClick={() => window.print()} className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700">Print / Save as PDF</button></div></div>
    <article className="print-report overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="report-title">
      <header className="report-cover bg-slate-950 px-5 py-8 text-white sm:px-8 sm:py-10"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Voice of Customer</p><h2 id="report-title" className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">Analysis Report</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">A locally generated record of customer sentiment, recurring themes, supporting evidence, and recommended actions.</p></header>
      <dl className="report-metadata grid border-b border-slate-200 bg-slate-50 sm:grid-cols-2 xl:grid-cols-4"><Metadata label="Source dataset" value={dataset.name} /><Metadata label="Conversations" value={analysis.conversationCount.toLocaleString()} /><Metadata label="Analyzed" value={analyzedDate} /><Metadata label="Model" value={analysis.model} /></dl>
      <div className="p-5 sm:p-8">
        <section className="report-section"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Executive summary</p><h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">What customers are telling you</h3><p className="mt-4 max-w-5xl text-sm leading-7 text-slate-600 sm:text-base">{analysis.result.overallSummary}</p></section>
        <section className="report-section mt-8 border-t border-slate-200 pt-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Sentiment totals</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><Sentiment label="Positive" value={analysis.result.sentimentSummary.positive} color="emerald" /><Sentiment label="Neutral" value={analysis.result.sentimentSummary.neutral} color="slate" /><Sentiment label="Negative" value={analysis.result.sentimentSummary.negative} color="rose" /></div></section>
        <section className="report-section mt-8 border-t border-slate-200 pt-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Theme register</p><h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">Recurring customer themes</h3></div><p className="text-sm text-slate-500">{analysis.result.themes.length} {analysis.result.themes.length === 1 ? "theme" : "themes"}</p></div><div className="mt-5 space-y-5">{analysis.result.themes.map((theme, index) => <ReportTheme key={`${theme.name}-${index}`} theme={theme} index={index} />)}</div></section>
      </div>
    </article>
  </div>;
}

function Metadata({ label, value }: { label: string; value: string }) { return <div className="min-w-0 border-b border-slate-200 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-800">{value}</dd></div>; }
const sentimentClasses = { emerald: "border-emerald-200 bg-emerald-50 text-emerald-800", slate: "border-slate-200 bg-slate-50 text-slate-700", rose: "border-rose-200 bg-rose-50 text-rose-800" };
function Sentiment({ label, value, color }: { label: string; value: number; color: keyof typeof sentimentClasses }) { return <div className={`report-card rounded-xl border p-4 ${sentimentClasses[color]}`}><p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-75">{label}</p><p className="mt-2 text-3xl font-semibold">{value.toLocaleString()}</p><p className="mt-1 text-xs opacity-75">conversations</p></div>; }
const severityClasses: Record<AnalysisTheme["severity"], string> = { low: "bg-sky-100 text-sky-700", medium: "bg-amber-100 text-amber-800", high: "bg-orange-100 text-orange-800", critical: "bg-rose-100 text-rose-800" };
function ReportTheme({ theme, index }: { theme: AnalysisTheme; index: number }) { return <article className="report-theme break-inside-avoid rounded-2xl border border-slate-200"><div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-mono text-xs text-slate-400">THEME {String(index + 1).padStart(2, "0")}</p><h4 className="mt-2 text-lg font-semibold text-slate-950">{theme.name}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{theme.description}</p></div><div className="flex shrink-0 items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${severityClasses[theme.severity]}`}>{theme.severity}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{theme.frequency.toLocaleString()} conversations</span></div></div><div className="grid md:grid-cols-2"><div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Customer evidence</p>{theme.evidence.length ? <ul className="mt-3 space-y-2">{theme.evidence.map((evidence, evidenceIndex) => <li key={`${evidence}-${evidenceIndex}`} className="border-l-2 border-indigo-300 pl-3 text-sm italic leading-6 text-slate-600">“{evidence}”</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">No direct excerpts were returned.</p>}</div><div className="bg-slate-50/70 p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Recommended action</p><p className="mt-3 text-sm font-medium leading-6 text-slate-800">{theme.recommendedAction}</p></div></div></article>; }
function ReportLoading() { return <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10"><div role="status" className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="sr-only">Loading local report</span><div className="h-8 w-72 max-w-full rounded bg-slate-200" /><div className="mt-6 h-32 rounded-xl bg-slate-100" /><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="h-24 rounded-xl bg-slate-100" /><div className="h-24 rounded-xl bg-slate-100" /><div className="h-24 rounded-xl bg-slate-100" /></div></div></div>; }
function ReportEmpty() { return <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10"><section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center shadow-sm"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700" aria-hidden="true">▤</span><h2 className="mt-5 text-xl font-semibold text-slate-950">No saved analysis report</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Import conversations and run AI analysis first. Reports are created locally from the latest matching saved result.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/import" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Import Data</Link><Link href="/analysis" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">Analysis Results</Link></div></section></div>; }
function ReportError({ message }: { message: string }) { return <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10"><section role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Local report unavailable</h2><p className="mt-2 text-sm leading-6 text-rose-700">{message}</p><Link href="/analysis" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">Open Analysis Results</Link></section></div>; }

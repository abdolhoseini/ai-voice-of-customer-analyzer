"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AnalysisTheme } from "@/lib/analysis";
import { countPriorityThemes, rankThemes } from "@/lib/dashboard-metrics";
import {
  getCurrentAnalysisLookup,
  getCurrentDataset,
  getDatasetStoreMessage,
  type StoredAnalysis,
  type StoredDataset,
} from "@/lib/dataset-store";

type InsightState =
  | { status: "loading" }
  | { status: "no-dataset" }
  | { status: "dataset-only"; dataset: StoredDataset }
  | { status: "invalid-analysis"; dataset: StoredDataset }
  | { status: "live"; dataset: StoredDataset; analysis: StoredAnalysis }
  | { status: "error"; message: string };

type SeverityFilter = "all" | AnalysisTheme["severity"];

const filters: { value: SeverityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const severityStyles: Record<AnalysisTheme["severity"], string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-sky-200 bg-sky-50 text-sky-700",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function PageLink({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return <Link href={href} className={`inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${primary ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>{children}</Link>;
}

function EmptyState({ eyebrow, title, description, datasetName }: { eyebrow: string; title: string; description: string; datasetName?: string }) {
  return <section className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:px-10">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p>
    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
    {datasetName ? <p className="mt-3 break-words text-sm font-semibold text-slate-800">Current dataset: {datasetName}</p> : null}
    <div className="mt-7 flex flex-wrap justify-center gap-3">
      <PageLink href="/analysis" primary={Boolean(datasetName)}>Analysis Results</PageLink>
      <PageLink href="/import" primary={!datasetName}>Import Data</PageLink>
      <PageLink href="/">Dashboard</PageLink>
    </div>
  </section>;
}

export function InsightsView() {
  const [state, setState] = useState<InsightState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const dataset = await getCurrentDataset();
        if (cancelled) return;
        if (!dataset) { setState({ status: "no-dataset" }); return; }
        const lookup = await getCurrentAnalysisLookup(dataset);
        if (cancelled) return;
        if (lookup.status === "matching") setState({ status: "live", dataset, analysis: lookup.analysis });
        else if (lookup.status === "invalid") setState({ status: "invalid-analysis", dataset });
        else setState({ status: "dataset-only", dataset });
      } catch (error) {
        if (!cancelled) setState({ status: "error", message: getDatasetStoreMessage(error) });
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  if (state.status === "loading") return <div aria-label="Loading actionable insights" aria-busy="true" className="space-y-5"><div className="h-40 animate-pulse rounded-2xl bg-slate-200" /><div className="h-80 animate-pulse rounded-2xl bg-slate-200" /></div>;
  if (state.status === "no-dataset") return <EmptyState eyebrow="No local dataset" title="Import conversations before creating an action queue" description="Insights uses the current dataset and its matching analysis saved in this browser." />;
  if (state.status === "dataset-only") return <EmptyState eyebrow="Dataset ready" title="Analyze this dataset to create insights" description={`${state.dataset.conversations.length.toLocaleString()} conversations are ready, but no matching saved analysis exists yet.`} datasetName={state.dataset.name} />;
  if (state.status === "invalid-analysis") return <EmptyState eyebrow="Saved result removed" title="A fresh analysis is required" description="The saved analysis was corrupted or belonged to a different dataset, so it was removed and no insights are being shown." datasetName={state.dataset.name} />;
  if (state.status === "error") return <EmptyState eyebrow="Local storage unavailable" title="Insights could not load" description={state.message} />;
  return <LiveInsights dataset={state.dataset} analysis={state.analysis} />;
}

function LiveInsights({ dataset, analysis }: { dataset: StoredDataset; analysis: StoredAnalysis }) {
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const rankedThemes = useMemo(() => rankThemes(analysis.result.themes), [analysis.result.themes]);
  const filteredThemes = filter === "all" ? rankedThemes : rankedThemes.filter((theme) => theme.severity === filter);
  const topPriority = rankedThemes[0];
  const evidenceCount = rankedThemes.reduce((total, theme) => total + theme.evidence.length, 0);

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-5 bg-slate-950 px-6 py-6 text-white sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Current decision brief</p><h2 className="mt-2 break-words text-2xl font-semibold tracking-tight">{dataset.name}</h2><p className="mt-2 text-sm text-slate-300">Analyzed {formatDateTime(analysis.analyzedAt)} · {analysis.model}</p></div>
        <nav aria-label="Insights actions" className="flex flex-wrap gap-2"><Link href="/analysis" className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold hover:bg-white/10">Analysis Results</Link><Link href="/" className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold hover:bg-white/10">Dashboard</Link><Link href="/reports" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-indigo-50">Reports</Link></nav>
      </div>
      <dl className="grid divide-y divide-slate-200 bg-slate-50 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        <Metric label="Conversations" value={dataset.conversations.length} />
        <Metric label="Total themes" value={rankedThemes.length} />
        <Metric label="High/critical themes" value={countPriorityThemes(rankedThemes)} />
        <Metric label="Evidence quotes" value={evidenceCount} />
      </dl>
    </section>

    {topPriority ? <section aria-labelledby="top-priority-heading" className="overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-950 text-white shadow-sm">
      <div className="grid lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Top priority</p><h2 id="top-priority-heading" className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{topPriority.name}</h2><div className="mt-5 flex flex-wrap items-center gap-3"><SeverityBadge severity={topPriority.severity} dark /><span className="text-sm font-semibold text-indigo-100">{topPriority.frequency.toLocaleString()} {topPriority.frequency === 1 ? "mention" : "mentions"}</span></div><p className="mt-6 text-sm leading-6 text-indigo-100">This theme is ranked first using {topPriority.severity} severity and {topPriority.frequency.toLocaleString()} {topPriority.frequency === 1 ? "mention" : "mentions"}. The queue orders severity first, frequency second, and resolves equal values alphabetically.</p></div>
        <div className="p-6 sm:p-8"><p className="text-sm leading-7 text-slate-200">{topPriority.description}</p><EvidenceList evidence={topPriority.evidence} dark /><div className="mt-6 rounded-xl bg-white/10 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">Recommended action</p><p className="mt-2 text-sm font-medium leading-6 text-white">{topPriority.recommendedAction}</p></div></div>
      </div>
    </section> : <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Top priority</p><h2 className="mt-2 text-xl font-semibold text-slate-950">No themes to prioritize</h2><p className="mt-2 text-sm text-slate-500">The matching saved analysis contains zero themes.</p></section>}

    <section aria-labelledby="action-queue-heading" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Deterministic order</p><h2 id="action-queue-heading" className="mt-1 text-xl font-semibold text-slate-950">Action Queue</h2><p className="mt-1 text-sm text-slate-500">Severity first, then frequency, then theme name.</p></div><div role="group" aria-label="Filter action queue by severity" className="flex flex-wrap gap-2">{filters.map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)} className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${filter === item.value ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}>{item.label}</button>)}</div></div></div>
      <div aria-live="polite">
        {filteredThemes.length ? <ol className="divide-y divide-slate-200">{filteredThemes.map((theme) => {
          const rank = rankedThemes.indexOf(theme) + 1;
          return <li key={`${theme.name}-${rank}`} data-insight-theme={theme.name} data-severity={theme.severity} className="p-5 sm:p-6"><article className="grid gap-5 lg:grid-cols-[4rem_minmax(0,1fr)]"><div><span aria-label={`Priority rank ${rank}`} className="grid size-11 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">{String(rank).padStart(2, "0")}</span></div><div><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold text-slate-950">{theme.name}</h3><p className="mt-1 text-sm font-medium text-slate-500">{theme.frequency.toLocaleString()} {theme.frequency === 1 ? "mention" : "mentions"}</p></div><SeverityBadge severity={theme.severity} /></div><p className="mt-4 text-sm leading-6 text-slate-700">{theme.description}</p><EvidenceList evidence={theme.evidence} /><div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Recommended action</p><p className="mt-2 text-sm font-medium leading-6 text-slate-800">{theme.recommendedAction}</p></div></div></article></li>;
        })}</ol> : <div data-empty-filter={filter} className="px-6 py-12 text-center"><h3 className="text-lg font-semibold text-slate-950">No {filter === "all" ? "" : `${filter} `}themes</h3><p className="mt-2 text-sm text-slate-500">No saved theme matches this severity filter.</p></div>}
      </div>
    </section>
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="px-6 py-5"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</dt><dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value.toLocaleString()}</dd></div>; }

function SeverityBadge({ severity, dark = false }: { severity: AnalysisTheme["severity"]; dark?: boolean }) { return <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${dark ? "border-white/20 bg-white/10 text-white" : severityStyles[severity]}`}>{severity}</span>; }

function EvidenceList({ evidence, dark = false }: { evidence: string[]; dark?: boolean }) {
  return <div className="mt-5"><p className={`text-xs font-semibold uppercase tracking-[0.14em] ${dark ? "text-indigo-300" : "text-slate-500"}`}>Supporting evidence · {evidence.length} {evidence.length === 1 ? "quote" : "quotes"}</p>{evidence.length ? <ul className="mt-3 space-y-2">{evidence.map((quote, index) => <li key={`${quote}-${index}`} className={`border-l-2 pl-3 text-sm italic leading-6 ${dark ? "border-indigo-400 text-slate-200" : "border-indigo-300 text-slate-600"}`}>“{quote}”</li>)}</ul> : <p className={`mt-2 text-sm ${dark ? "text-slate-300" : "text-slate-500"}`}>No supporting evidence was returned.</p>}</div>;
}

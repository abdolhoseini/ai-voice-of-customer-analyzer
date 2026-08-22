"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  calculateSentimentPercentages,
  countPriorityThemes,
  rankThemes,
} from "@/lib/dashboard-metrics";
import {
  getCurrentAnalysisLookup,
  getCurrentDataset,
  getDatasetStoreMessage,
  type StoredAnalysis,
  type StoredDataset,
} from "@/lib/dataset-store";

type DashboardState =
  | { status: "loading" }
  | { status: "no-dataset" }
  | { status: "dataset-only"; dataset: StoredDataset }
  | { status: "invalid-analysis"; dataset: StoredDataset }
  | { status: "live"; dataset: StoredDataset; analysis: StoredAnalysis }
  | { status: "error"; message: string };

const severityStyles = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  high: "border-orange-200 bg-orange-50 text-orange-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
} as const;

const sentimentStyles = {
  positive: { dot: "bg-emerald-500", bar: "bg-emerald-500" },
  neutral: { dot: "bg-slate-400", bar: "bg-slate-400" },
  negative: { dot: "bg-rose-500", bar: "bg-rose-500" },
} as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function EmptyState({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">{children}</div>
    </section>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      {children}
    </Link>
  );
}

export function DashboardView() {
  const [state, setState] = useState<DashboardState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const dataset = await getCurrentDataset();

        if (cancelled) return;
        if (!dataset) {
          setState({ status: "no-dataset" });
          return;
        }

        const lookup = await getCurrentAnalysisLookup(dataset);
        if (cancelled) return;

        if (lookup.status === "matching") {
          setState({ status: "live", dataset, analysis: lookup.analysis });
        } else if (lookup.status === "invalid") {
          setState({ status: "invalid-analysis", dataset });
        } else {
          setState({ status: "dataset-only", dataset });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ status: "error", message: getDatasetStoreMessage(error) });
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <section aria-label="Loading dashboard" aria-busy="true" className="space-y-5">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </section>
    );
  }

  if (state.status === "no-dataset") {
    return (
      <EmptyState
        eyebrow="No local dataset"
        title="Import conversations to build your dashboard"
        description="This dashboard uses only the current dataset saved in this browser and its matching analysis. Start by importing customer conversations."
      >
        <PrimaryLink href="/import">Import Data</PrimaryLink>
        <SecondaryLink href="/analysis">Analysis Results</SecondaryLink>
      </EmptyState>
    );
  }

  if (state.status === "error") {
    return (
      <EmptyState
        eyebrow="Local storage unavailable"
        title="The dashboard could not load"
        description={state.message}
      >
        <PrimaryLink href="/import">Import Data</PrimaryLink>
      </EmptyState>
    );
  }

  if (state.status === "dataset-only") {
    return (
      <EmptyState
        eyebrow="Dataset ready"
        title="Run an analysis to reveal live signals"
        description={`${state.dataset.name} contains ${state.dataset.conversations.length.toLocaleString()} conversations. Its matching analysis has not been saved yet.`}
      >
        <PrimaryLink href="/analysis">Go to Analysis Results</PrimaryLink>
        <SecondaryLink href="/import">Replace Dataset</SecondaryLink>
      </EmptyState>
    );
  }

  if (state.status === "invalid-analysis") {
    return (
      <EmptyState
        eyebrow="Saved result removed"
        title="This dataset needs a fresh analysis"
        description={`The saved analysis was corrupted or belonged to a different dataset, so it was removed and is not being displayed for ${state.dataset.name}.`}
      >
        <PrimaryLink href="/analysis">Run Analysis</PrimaryLink>
        <SecondaryLink href="/import">Replace Dataset</SecondaryLink>
      </EmptyState>
    );
  }

  return <LiveDashboard dataset={state.dataset} analysis={state.analysis} />;
}

function LiveDashboard({ dataset, analysis }: { dataset: StoredDataset; analysis: StoredAnalysis }) {
  const themes = rankThemes(analysis.result.themes);
  const percentages = calculateSentimentPercentages(analysis.result.sentimentSummary);
  const totalConversations = dataset.conversations.length;
  const negativeConversations = analysis.result.sentimentSummary.negative;
  const priorityThemes = countPriorityThemes(themes);
  const topIssue = themes[0];

  const metrics = [
    {
      label: "Total conversations",
      value: totalConversations.toLocaleString(),
      detail: "In the current dataset",
    },
    {
      label: "Negative conversations",
      value: negativeConversations.toLocaleString(),
      detail: `${percentages.negative}% of analyzed conversations`,
    },
    {
      label: "High/critical themes",
      value: priorityThemes.toLocaleString(),
      detail: "Priority themes requiring attention",
    },
    {
      label: "Top-ranked theme",
      value: topIssue?.name ?? "No themes identified",
      detail: topIssue
        ? `${topIssue.severity} severity · ${topIssue.frequency.toLocaleString()} mentions`
        : "No theme signals were returned",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-800 px-6 py-6 text-white shadow-sm sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Live local analysis</p>
            <h2 className="mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl">{dataset.name}</h2>
            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-indigo-100">
              <div>
                <dt className="sr-only">Last analyzed</dt>
                <dd>Analyzed {formatDateTime(analysis.analyzedAt)}</dd>
              </div>
              <div>
                <dt className="sr-only">Model</dt>
                <dd>Model: {analysis.model}</dd>
              </div>
            </dl>
          </div>
          <nav aria-label="Dashboard actions" className="flex flex-wrap gap-2">
            <Link href="/import" className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Import Data</Link>
            <Link href="/analysis" className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Analysis Results</Link>
            <Link href="/reports" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-50">Reports</Link>
          </nav>
        </div>
      </section>

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">Key metrics</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
              <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950">{metric.value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <section aria-labelledby="themes-heading" className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Ranked signal ledger</p>
            <h2 id="themes-heading" className="mt-1 text-xl font-bold text-slate-950">Customer themes</h2>
            <p className="mt-1 text-sm text-slate-500">Ranked by severity, frequency, then name.</p>
          </div>

          {themes.length === 0 ? (
            <p className="px-6 py-10 text-sm text-slate-600">No themes were identified in the saved analysis.</p>
          ) : (
            <ol className="divide-y divide-slate-200">
              {themes.map((theme, index) => (
                <li key={`${theme.name}-${index}`} data-dashboard-theme={theme.name} className="px-5 py-6 sm:px-6">
                  <article>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span aria-label={`Rank ${index + 1}`} className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h3 className="break-words text-base font-bold text-slate-950">{theme.name}</h3>
                          <p className="mt-1 text-sm font-medium text-slate-500">{theme.frequency.toLocaleString()} mentions</p>
                        </div>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${severityStyles[theme.severity]}`}>
                        {theme.severity}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-700">{theme.description}</p>
                    <blockquote className="mt-4 border-l-2 border-indigo-300 pl-4 text-sm italic leading-6 text-slate-600">
                      “{theme.evidence[0] ?? "No supporting evidence was returned."}”
                    </blockquote>
                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Recommended action</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{theme.recommendedAction}</p>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside aria-labelledby="sentiment-heading" className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Conversation mix</p>
          <h2 id="sentiment-heading" className="mt-1 text-xl font-bold text-slate-950">Sentiment overview</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Counts returned by the saved analysis.</p>

          <div
            className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label={`Sentiment: ${percentages.positive}% positive, ${percentages.neutral}% neutral, ${percentages.negative}% negative`}
          >
            {(["positive", "neutral", "negative"] as const).map((sentiment) => (
              <span
                key={sentiment}
                className={sentimentStyles[sentiment].bar}
                style={{ width: `${percentages[sentiment]}%` }}
              />
            ))}
          </div>

          <dl className="mt-6 space-y-4">
            {(["positive", "neutral", "negative"] as const).map((sentiment) => (
              <div key={sentiment} className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-sm font-medium capitalize text-slate-700">
                  <span className={`size-2.5 rounded-full ${sentimentStyles[sentiment].dot}`} />
                  {sentiment}
                </dt>
                <dd className="text-right">
                  <span className="font-bold text-slate-950">{analysis.result.sentimentSummary[sentiment].toLocaleString()}</span>
                  <span className="ml-2 text-sm text-slate-500">{percentages[sentiment]}%</span>
                </dd>
              </div>
            ))}
          </dl>

          {totalConversations === 0 ? (
            <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">No analyzed conversations. Percentages remain at 0%.</p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { clearCurrentDataset, getCurrentDataset, getDatasetStoreMessage, type StoredDataset } from "@/lib/dataset-store";

type ViewState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "loaded"; dataset: StoredDataset };

export function AnalysisDataset() {
  const [state, setState] = useState<ViewState>({ status: "loading" });
  const [clearing, setClearing] = useState(false);

  const loadDataset = useCallback(async () => {
    try {
      const dataset = await getCurrentDataset();
      setState(dataset ? { status: "loaded", dataset } : { status: "empty" });
    } catch (error) {
      setState({ status: "error", message: getDatasetStoreMessage(error) });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getCurrentDataset()
      .then((dataset) => { if (!cancelled) setState(dataset ? { status: "loaded", dataset } : { status: "empty" }); })
      .catch((error: unknown) => { if (!cancelled) setState({ status: "error", message: getDatasetStoreMessage(error) }); });
    return () => { cancelled = true; };
  }, []);

  async function clearDataset() {
    if (!window.confirm("Clear the current local dataset? This cannot be undone.")) return;
    setClearing(true);
    try {
      await clearCurrentDataset();
      setState({ status: "empty" });
    } catch (error) {
      setState({ status: "error", message: getDatasetStoreMessage(error) });
    } finally {
      setClearing(false);
    }
  }

  if (state.status === "loading") return <LoadingState />;
  if (state.status === "empty") return <EmptyState />;
  if (state.status === "error") return <ErrorState message={state.message} onRetry={() => { setState({ status: "loading" }); void loadDataset(); }} />;

  const { dataset } = state;
  const rows = dataset.conversations.slice(0, 10);
  const imported = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(dataset.importedAt));

  return <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-6 border-b border-slate-200 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div className="min-w-0"><div className="flex items-center gap-2 text-emerald-700"><span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100"><Icon name="check" className="h-4 w-4" /></span><p className="text-sm font-semibold">Dataset loaded from this device</p></div><h2 className="mt-4 truncate text-xl font-semibold tracking-tight text-slate-950">{dataset.name}</h2><p className="mt-1 text-sm text-slate-500">Ready for review. No conversations have been sent to a server.</p></div>
        <div className="flex flex-col gap-3 sm:flex-row"><Link href="/import" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Replace Dataset</Link><button type="button" onClick={() => void clearDataset()} disabled={clearing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-60"><Icon name="trash" className="h-4 w-4" />{clearing ? "Clearing…" : "Clear Local Dataset"}</button></div>
      </div>
      <dl className="grid divide-y divide-slate-100 bg-slate-50/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Summary label="Source" value={dataset.name} />
        <Summary label="Total conversations" value={dataset.conversationCount.toLocaleString()} />
        <Summary label="Imported" value={imported} />
      </dl>
    </section>

    <section className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 className="text-lg font-semibold text-slate-950">Conversation preview</h2><p className="mt-1 text-sm text-slate-500">Showing the first {rows.length} of {dataset.conversationCount.toLocaleString()} conversations.</p></div><div className="sm:text-right"><button type="button" disabled className="min-h-11 cursor-not-allowed rounded-xl bg-slate-200 px-5 text-sm font-semibold text-slate-500">Run AI Analysis</button><p className="mt-1.5 text-xs text-slate-500">AI provider integration is required in the next phase.</p></div></div>
      <div className="w-full overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">ID</th><th className="px-5 py-3 font-semibold">Customer Message</th><th className="px-5 py-3 font-semibold">Chatbot Response</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Channel</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={`${row.id}-${index}`} className="align-top"><td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-500">{row.id}</td><td className="max-w-md px-5 py-4 leading-6 text-slate-800">{row.customerMessage}</td><td className="max-w-sm px-5 py-4 leading-6 text-slate-500">{row.chatbotResponse || "—"}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{row.date || "—"}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{row.channel || "—"}</td></tr>)}</tbody></table></div>
    </section>
  </div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 px-5 py-4"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 truncate text-sm font-semibold text-slate-800">{value}</dd></div>;
}

function LoadingState() {
  return <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10"><div role="status" className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="sr-only">Loading local dataset</span><div className="h-5 w-44 rounded bg-slate-200" /><div className="mt-4 h-8 w-72 max-w-full rounded bg-slate-100" /><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="h-20 rounded-xl bg-slate-100" /><div className="h-20 rounded-xl bg-slate-100" /><div className="h-20 rounded-xl bg-slate-100" /></div></div></div>;
}

function EmptyState() {
  return <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10"><section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center shadow-sm"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700"><Icon name="import" /></span><h2 className="mt-5 text-xl font-semibold text-slate-950">No local dataset found</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Import and validate customer conversations to prepare an analysis dataset on this device.</p><Link href="/import" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Import Conversations</Link></section></div>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10"><section role="alert" className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Local dataset unavailable</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-rose-700">{message}</p><div className="mt-5 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={onRetry} className="min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">Try Again</button><Link href="/import" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">Replace Dataset</Link></div></section></div>;
}

import type { Metadata } from "next";
import { AnalysisDataset } from "./analysis-dataset";

export const metadata: Metadata = { title: "Analysis Results | AI Voice of Customer Analyzer" };

export default function AnalysisPage() {
  return <main>
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Analysis workspace</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Analysis Results</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Review the locally stored dataset before connecting an AI provider.</p></div></header>
    <AnalysisDataset />
  </main>;
}

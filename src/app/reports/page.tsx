import type { Metadata } from "next";
import { ReportsView } from "./reports-view";

export const metadata: Metadata = { title: "Reports | AI Voice of Customer Analyzer" };

export default function ReportsPage() {
  return <main><header className="no-print border-b border-slate-200 bg-white"><div className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Local reports</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Reports</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Review, download, or print the latest analysis saved on this device.</p></div></header><ReportsView /></main>;
}

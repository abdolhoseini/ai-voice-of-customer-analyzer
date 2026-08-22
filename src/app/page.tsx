import type { Metadata } from "next";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = { title: "Dashboard | AI Voice of Customer Analyzer" };

export default function Home() {
  return <main id="overview"><header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-[1600px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Current workspace</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Customer Insights Dashboard</h1><p className="mt-2 text-sm text-slate-500 sm:text-base">Live signals from the dataset and analysis saved in this browser.</p></div></header><DashboardView /></main>;
}

import type { Metadata } from "next";
import { InsightsView } from "./insights-view";

export const metadata: Metadata = { title: "Actionable Insights | AI Voice of Customer Analyzer" };

export default function InsightsPage() {
  return <main>
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Evidence to action</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Actionable Insights</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">Turn the latest analysis saved on this device into a factual, ranked action queue.</p>
      </div>
    </header>
    <InsightsView />
  </main>;
}

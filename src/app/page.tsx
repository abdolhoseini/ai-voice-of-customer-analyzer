import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";

const summaries: { label: string; value: string; note: string; icon: IconName; tone: string }[] = [
  { label: "Total Conversations", value: "1,248", note: "Across all channels", icon: "conversations", tone: "bg-blue-50 text-blue-700" },
  { label: "Negative Sentiment", value: "38%", note: "474 conversations", icon: "sentiment", tone: "bg-indigo-50 text-indigo-700" },
  { label: "Critical Issues", value: "27", note: "Require attention", icon: "critical", tone: "bg-rose-50 text-rose-700" },
  { label: "Top Issue", value: "Delivery Delays", note: "186 conversations", icon: "issue", tone: "bg-amber-50 text-amber-700" },
];
const problems = [
  ["Delivery delays", "186", "Negative", "Critical", "“My order was due three days ago and tracking still hasn’t updated.”"],
  ["Payment failures", "143", "Negative", "High", "“The payment failed twice, but I can see two pending charges.”"],
  ["Account access", "118", "Negative", "High", "“The reset link expires before I can get back into my account.”"],
  ["Product quality", "96", "Mixed", "Medium", "“The finish looks different from the photos and feels less durable.”"],
  ["Refund requests", "74", "Negative", "Medium", "“I returned this last week but haven’t received a refund update.”"],
];

export default function Home() {
  return <main id="overview">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 lg:py-8"><div><div className="mb-2 flex flex-wrap items-center gap-2"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Overview · August 2026</p><span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700">Demo data</span></div><h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Customer Insights Dashboard</h1><p className="mt-2 text-sm text-slate-500 sm:text-base">Turn customer conversations into actionable insights</p></div><Link href="/import" className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><Icon name="import" className="h-4 w-4" />Import Conversations</Link></div></header>
    <div className="mx-auto max-w-[1600px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">{summaries.map(item => <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{item.label}</p><p className={`mt-2 font-semibold tracking-tight text-slate-950 ${item.label === "Top Issue" ? "text-xl" : "text-3xl"}`}>{item.value}</p></div><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.tone}`}><Icon name={item.icon} /></span></div><p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">{item.note}</p></article>)}</section>
      <div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-5 sm:px-6"><h2 className="text-lg font-semibold tracking-tight text-slate-950">Top Customer Problems</h2><p className="mt-1 text-sm text-slate-500">Recurring themes ranked by conversation volume</p></div><div className="divide-y divide-slate-100">{problems.map((p, i) => <article key={p[0]} className="grid gap-4 px-5 py-5 hover:bg-slate-50/70 sm:px-6 xl:grid-cols-[minmax(150px,1fr)_100px_100px_100px_minmax(250px,1.6fr)] xl:items-center"><div className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">{String(i + 1).padStart(2, "0")}</span><h3 className="font-semibold text-slate-900">{p[0]}</h3></div><p className="text-sm font-semibold text-slate-700">{p[1]}</p><span className="w-fit rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">{p[2]}</span><span className="text-xs font-semibold text-orange-700">{p[3]}</span><blockquote className="border-l-2 border-indigo-200 pl-3 text-sm leading-6 text-slate-500">{p[4]}</blockquote></article>)}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">Conversation signal</p><h2 className="mt-2 text-lg font-semibold text-slate-950">Sentiment Overview</h2><p className="mt-1 text-sm leading-6 text-slate-500">How customers felt across all analyzed conversations.</p><div className="mt-7 flex h-4 overflow-hidden rounded-full"><span className="w-[32%] bg-blue-500" /><span className="w-[30%] bg-slate-400" /><span className="w-[38%] bg-indigo-600" /></div>{[["Positive",32],["Neutral",30],["Negative",38]].map(([label,value]) => <div key={String(label)} className="mt-4 flex items-center justify-between"><span className="text-sm font-medium text-slate-600">{label}</span><span className="font-mono text-sm font-semibold">{value}%</span></div>)}</section>
      </div>
    </div>
  </main>;
}

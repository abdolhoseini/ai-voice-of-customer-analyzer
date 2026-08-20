type IconName = "dashboard" | "import" | "analysis" | "insights" | "reports" | "conversations" | "sentiment" | "critical" | "issue";

const iconPaths: Record<IconName, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  import: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
  analysis: <path d="M4 19V9m5 10V5m5 14v-7m5 7V3" />,
  insights: <><path d="M9 18h6m-5 3h4" /><path d="M8.3 15.5A7 7 0 1 1 15.7 15.5c-.8.5-1.2 1.3-1.2 2.5h-5c0-1.2-.4-2-1.2-2.5Z" /></>,
  reports: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h6m-6 4h6" /></>,
  conversations: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 2 1.7-4.4A7 7 0 0 1 3 12V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /><path d="M8 10h8m-8 4h5" /></>,
  sentiment: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>,
  critical: <><path d="M10.3 3.6 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
  issue: <path d="M3 12h4l2-7 4 14 2-7h6" />,
};

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

const navigation: { label: string; icon: IconName }[] = [
  { label: "Dashboard", icon: "dashboard" }, { label: "Import Data", icon: "import" },
  { label: "Analysis Results", icon: "analysis" }, { label: "Insights", icon: "insights" }, { label: "Reports", icon: "reports" },
];

const summaries: { label: string; value: string; note: string; icon: IconName; tone: string }[] = [
  { label: "Total Conversations", value: "1,248", note: "Across all channels", icon: "conversations", tone: "bg-blue-50 text-blue-700" },
  { label: "Negative Sentiment", value: "38%", note: "474 conversations", icon: "sentiment", tone: "bg-indigo-50 text-indigo-700" },
  { label: "Critical Issues", value: "27", note: "Require attention", icon: "critical", tone: "bg-rose-50 text-rose-700" },
  { label: "Top Issue", value: "Delivery Delays", note: "186 conversations", icon: "issue", tone: "bg-amber-50 text-amber-700" },
];

const problems = [
  { name: "Delivery delays", count: 186, sentiment: "Negative", severity: "Critical", evidence: "“My order was due three days ago and tracking still hasn’t updated.”" },
  { name: "Payment failures", count: 143, sentiment: "Negative", severity: "High", evidence: "“The payment failed twice, but I can see two pending charges.”" },
  { name: "Account access", count: 118, sentiment: "Negative", severity: "High", evidence: "“The reset link expires before I can get back into my account.”" },
  { name: "Product quality", count: 96, sentiment: "Mixed", severity: "Medium", evidence: "“The finish looks different from the photos and feels less durable.”" },
  { name: "Refund requests", count: 74, sentiment: "Negative", severity: "Medium", evidence: "“I returned this last week but haven’t received a refund update.”" },
];

function Sidebar() {
  return <aside className="border-b border-slate-200 bg-slate-950 text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r lg:border-slate-800">
    <div className="flex h-16 items-center gap-3 px-5 lg:h-20 lg:px-7"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-950/30"><span className="flex items-end gap-0.5" aria-hidden="true"><i className="h-2 w-0.5 rounded-full bg-white" /><i className="h-4 w-0.5 rounded-full bg-white" /><i className="h-3 w-0.5 rounded-full bg-white" /><i className="h-5 w-0.5 rounded-full bg-white" /><i className="h-2.5 w-0.5 rounded-full bg-white" /></span></div><div className="min-w-0"><p className="truncate text-sm font-semibold tracking-tight">Voice of Customer</p><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">AI Analyzer</p></div></div>
    <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:px-4 lg:pt-6">{navigation.map((item, index) => <a key={item.label} href={index === 0 ? "#overview" : `#${item.label.toLowerCase().replace(" ", "-")}`} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 lg:mb-1 ${index === 0 ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400 hover:bg-slate-900 hover:text-white"}`}><Icon name={item.icon} className="h-[18px] w-[18px]" />{item.label}</a>)}</nav>
    <div className="absolute bottom-6 left-4 right-4 hidden rounded-xl border border-slate-800 bg-slate-900/70 p-4 lg:block"><p className="text-xs font-medium text-slate-300">Analysis status</p><div className="mt-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-xs text-slate-400">All conversations processed</span></div></div>
  </aside>;
}

function SummaryCard({ item }: { item: (typeof summaries)[number] }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{item.label}</p><p className={`mt-2 font-semibold tracking-tight text-slate-950 ${item.label === "Top Issue" ? "text-xl" : "text-3xl"}`}>{item.value}</p></div><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.tone}`}><Icon name={item.icon} /></span></div><p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">{item.note}</p></article>;
}

function ProblemsTable() {
  return <section id="analysis-results" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-5 sm:px-6"><div><h2 className="text-lg font-semibold tracking-tight text-slate-950">Top Customer Problems</h2><p className="mt-1 text-sm text-slate-500">Recurring themes ranked by conversation volume</p></div><span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 sm:block">Last 30 days</span></div><div className="divide-y divide-slate-100">{problems.map((problem, index) => <article key={problem.name} className="grid gap-4 px-5 py-5 transition-colors hover:bg-slate-50/70 sm:px-6 xl:grid-cols-[minmax(150px,1fr)_100px_100px_100px_minmax(250px,1.6fr)] xl:items-center"><div className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">{String(index + 1).padStart(2, "0")}</span><h3 className="font-semibold text-slate-900">{problem.name}</h3></div><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 xl:hidden">Conversations</p><p className="mt-1 text-sm font-semibold text-slate-700 xl:mt-0">{problem.count}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 xl:hidden">Sentiment</p><span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold xl:mt-0 ${problem.sentiment === "Mixed" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>{problem.sentiment}</span></div><div><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 xl:hidden">Severity</p><span className={`mt-1 inline-flex items-center gap-1.5 text-xs font-semibold xl:mt-0 ${problem.severity === "Critical" ? "text-rose-700" : problem.severity === "High" ? "text-orange-700" : "text-amber-700"}`}><i className={`h-1.5 w-1.5 rounded-full ${problem.severity === "Critical" ? "bg-rose-500" : problem.severity === "High" ? "bg-orange-500" : "bg-amber-500"}`} />{problem.severity}</span></div><blockquote className="border-l-2 border-indigo-200 pl-3 text-sm leading-6 text-slate-500">{problem.evidence}</blockquote></article>)}</div></section>;
}

function SentimentOverview() {
  const sentiments = [{ label: "Positive", value: 32, color: "bg-blue-500", text: "text-blue-700" }, { label: "Neutral", value: 30, color: "bg-slate-400", text: "text-slate-600" }, { label: "Negative", value: 38, color: "bg-indigo-600", text: "text-indigo-700" }];
  return <section id="insights" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">Conversation signal</p><h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">Sentiment Overview</h2><p className="mt-1 text-sm leading-6 text-slate-500">How customers felt across all analyzed conversations.</p><div className="mt-7 flex h-4 w-full overflow-hidden rounded-full bg-slate-100" aria-label="Sentiment distribution"><span className="bg-blue-500" style={{ width: "32%" }} /><span className="bg-slate-400" style={{ width: "30%" }} /><span className="bg-indigo-600" style={{ width: "38%" }} /></div><div className="mt-6 space-y-4">{sentiments.map(item => <div key={item.label} className="flex items-center justify-between"><div className="flex items-center gap-2.5"><span className={`h-2.5 w-2.5 rounded-full ${item.color}`} /><span className="text-sm font-medium text-slate-600">{item.label}</span></div><span className={`font-mono text-sm font-semibold ${item.text}`}>{item.value}%</span></div>)}</div><div className="mt-7 rounded-xl bg-indigo-50 p-4"><p className="text-xs font-semibold text-indigo-900">Key signal</p><p className="mt-1 text-sm leading-5 text-indigo-700">Negative sentiment is the largest segment, led by delivery and payment concerns.</p></div></section>;
}

export default function Home() {
  return <div className="min-h-screen bg-slate-50 text-slate-900"><Sidebar /><main id="overview" className="lg:ml-64"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-[1600px] flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 lg:py-8"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Overview · August 2026</p><h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Customer Insights Dashboard</h1><p className="mt-2 text-sm text-slate-500 sm:text-base">Turn customer conversations into actionable insights</p></div><a id="import-data" href="#analysis-results" className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"><Icon name="import" className="h-4 w-4" />Import Conversations</a></div></header><div className="mx-auto max-w-[1600px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8"><section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">{summaries.map(item => <SummaryCard key={item.label} item={item} />)}</section><div className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]"><ProblemsTable /><SentimentOverview /></div><div id="reports" /></div></main></div>;
}

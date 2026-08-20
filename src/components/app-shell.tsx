"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icons";

const navigation: { label: string; icon: IconName; href?: string }[] = [
  { label: "Dashboard", icon: "dashboard", href: "/" },
  { label: "Import Data", icon: "import", href: "/import" },
  { label: "Analysis Results", icon: "analysis", href: "/analysis" },
  { label: "Insights", icon: "insights" },
  { label: "Reports", icon: "reports" },
];

function Brand() {
  return <div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-950/30"><span className="flex items-end gap-0.5" aria-hidden="true"><i className="h-2 w-0.5 rounded-full bg-white" /><i className="h-4 w-0.5 rounded-full bg-white" /><i className="h-3 w-0.5 rounded-full bg-white" /><i className="h-5 w-0.5 rounded-full bg-white" /><i className="h-2.5 w-0.5 rounded-full bg-white" /></span></div><div className="min-w-0"><p className="truncate text-sm font-semibold tracking-tight">Voice of Customer</p><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">AI Analyzer</p></div></div>;
}

function NavItems({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return navigation.map((item) => {
    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href ?? "__disabled");
    const classes = `${mobile ? "min-h-11" : "mb-1 py-2.5"} flex items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-indigo-400 ${active ? "bg-indigo-500 text-white shadow-sm" : "text-slate-400"}`;
    if (!item.href) return <div key={item.label} aria-disabled="true" className={`${classes} cursor-not-allowed opacity-65`}><Icon name={item.icon} className="h-[18px] w-[18px]" /><span className="flex-1">{item.label}</span><span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">Soon</span></div>;
    return <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={`${classes} hover:bg-slate-900 hover:text-white`}><Icon name={item.icon} className="h-[18px] w-[18px]" />{item.label}</Link>;
  });
}

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
    <header className="relative z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950 px-4 text-white lg:hidden"><Brand /><details className="group relative ml-3 shrink-0"><summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 [&::-webkit-details-marker]:hidden"><span className="sr-only">Open navigation menu</span><Icon name="menu" /></summary><nav aria-label="Mobile navigation" className="absolute right-0 top-13 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl"><NavItems mobile /></nav></details></header>
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-950 text-white lg:block"><div className="flex h-20 items-center px-7"><Brand /></div><nav aria-label="Main navigation" className="px-4 pt-6"><NavItems /></nav><div className="absolute bottom-6 left-4 right-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4"><p className="text-xs font-medium text-slate-300">Private by design</p><div className="mt-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="text-xs text-slate-400">Local browser processing</span></div></div></aside>
    <div className="min-w-0 lg:ml-64">{children}</div>
  </div>;
}

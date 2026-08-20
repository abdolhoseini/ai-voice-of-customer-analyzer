import type { Metadata } from "next";
import { ImportConversations } from "./import-conversations";

export const metadata: Metadata = { title: "Import Conversations | AI Voice of Customer Analyzer" };

export default function ImportPage() {
  return <main><header className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-[1400px] px-5 py-7 sm:px-8 lg:px-10 lg:py-9"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Import data</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Import Customer Conversations</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Upload a CSV or TXT file, or paste customer messages directly, to prepare them for analysis.</p></div></header><ImportConversations /></main>;
}

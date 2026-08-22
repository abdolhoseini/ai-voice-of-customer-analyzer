"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { MAX_FILE_SIZE, parseCsv, parseText, type Conversation, type ProcessedData } from "@/lib/conversations";
import { createDataset, getDatasetStoreMessage, saveCurrentDataset, type DatasetSourceType } from "@/lib/dataset-store";

type FileInfo = { name: string; type: string; size: number };
const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function ImportConversations() {
  const [method, setMethod] = useState<"upload" | "paste">("upload");
  const [data, setData] = useState<ProcessedData | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pasteValue, setPasteValue] = useState("");
  const [dragging, setDragging] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] = useState<DatasetSourceType>("csv");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function acceptResult(result: ProcessedData, info: FileInfo | null, name: string, type: DatasetSourceType, successNotice = "") {
    setData(result); setFileInfo(info); setError("");
    setSourceName(name); setSourceType(type);
    setNotice(result.excluded ? `${result.excluded.toLocaleString()} additional valid conversations were excluded because this MVP processes a maximum of 5,000.` : successNotice);
  }
  function clear() { setData(null); setFileInfo(null); setError(""); setNotice(""); setSourceName(""); if (inputRef.current) inputRef.current.value = ""; }
  async function processFile(file: File) {
    clear();
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "csv" && extension !== "txt") { setError("Unsupported file type. Choose a .csv or .txt file."); return; }
    if (file.size > MAX_FILE_SIZE) { setError("File is larger than 5 MB. Choose a smaller file."); return; }
    try {
      const text = await file.text();
      if (!text.trim()) throw new Error("The selected file is empty.");
      const result = extension === "csv" ? parseCsv(text) : parseText(text);
      acceptResult(result, { name: file.name, type: extension === "csv" ? "CSV" : "TXT", size: file.size }, file.name, extension);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The file could not be processed."); }
  }
  function onFileChange(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (file) void processFile(file); }
  function onDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) void processFile(file); }
  function processPaste() { clear(); try { acceptResult(parseText(pasteValue), null, "Pasted text", "pasted_text"); } catch (caught) { setError(caught instanceof Error ? caught.message : "The text could not be processed."); } }
  async function loadSample() {
    clear();
    try {
      const response = await fetch("/sample-conversations.csv");
      if (!response.ok) throw new Error("Sample data could not be loaded.");
      const text = await response.text();
      acceptResult(parseCsv(text), { name: "sample-conversations.csv", type: "CSV sample", size: new Blob([text]).size }, "sample-conversations.csv", "sample", "Sample data loaded successfully.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Sample data could not be loaded."); }
  }

  async function continueToAnalysis() {
    if (!data?.conversations.length || !sourceName || saving) return;
    setSaving(true); setError("");
    try {
      await saveCurrentDataset(createDataset({ name: sourceName, sourceType, conversations: data.conversations }));
      router.push("/analysis");
    } catch (caught) {
      setError(getDatasetStoreMessage(caught));
      setSaving(false);
    }
  }

  return <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900"><Icon name="lock" className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="text-sm font-semibold">Your file is prepared locally</p><p className="mt-1 text-sm leading-5 text-blue-700">Files are parsed and stored in your browser. When you run AI analysis, the selected conversations are sent securely through the application server to Google Gemini.</p></div></div>
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex border-b border-slate-200 p-2" role="tablist" aria-label="Input method"><button type="button" role="tab" aria-selected={method === "upload"} onClick={() => setMethod("upload")} className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-indigo-600 ${method === "upload" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"}`}>Upload File</button><button type="button" role="tab" aria-selected={method === "paste"} onClick={() => setMethod("paste")} className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-indigo-600 ${method === "paste" ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"}`}>Paste Text</button></div>
        <div className="p-5 sm:p-6">{method === "upload" ? <div><div onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={event => event.preventDefault()} onDrop={onDrop} className={`rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-colors ${dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50/60"}`}><Icon name="upload" className="mx-auto h-8 w-8 text-indigo-600" /><p className="mt-4 text-sm font-semibold text-slate-800">Drag and drop your CSV or TXT file here</p><p className="mt-1 text-xs text-slate-500">Maximum file size: 5 MB</p><label className="mt-5 inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-indigo-600"><input ref={inputRef} type="file" accept=".csv,.txt,text/csv,text/plain" onChange={onFileChange} className="sr-only" />Choose file</label></div></div> : <div><label htmlFor="conversation-text" className="text-sm font-semibold text-slate-800">Customer messages</label><p id="paste-help" className="mt-1 text-xs text-slate-500">Enter one conversation per line. Empty lines are ignored.</p><textarea id="conversation-text" aria-describedby="paste-help" value={pasteValue} onChange={event => setPasteValue(event.target.value)} rows={9} placeholder={"My delivery has not arrived yet.\nI cannot sign in to my account."} className="mt-3 w-full resize-y rounded-xl border border-slate-300 p-4 text-sm leading-6 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /><button type="button" onClick={processPaste} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Process pasted text</button></div>}
          {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">{error}</div>}
          {notice && <div role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">{notice}</div>}
          {fileInfo && data && <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Icon name="file" /></span><dl className="grid min-w-0 flex-1 grid-cols-2 gap-x-5 gap-y-2 text-xs sm:grid-cols-4"><div className="col-span-2 sm:col-span-1"><dt className="text-slate-400">File name</dt><dd className="truncate font-semibold text-slate-800">{fileInfo.name}</dd></div><div><dt className="text-slate-400">Type</dt><dd className="font-semibold text-slate-800">{fileInfo.type}</dd></div><div><dt className="text-slate-400">Size</dt><dd className="font-semibold text-slate-800">{formatSize(fileInfo.size)}</dd></div><div><dt className="text-slate-400">Valid conversations</dt><dd className="font-semibold text-slate-800">{data.conversations.length.toLocaleString()}</dd></div></dl><button type="button" onClick={clear} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600"><Icon name="trash" className="h-4 w-4" />Remove</button></div>}
        </div>
      </section>
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold text-slate-900">Get started quickly</h2><p className="mt-2 text-sm leading-6 text-slate-500">Use fictional sample conversations or download the required CSV structure.</p><button type="button" onClick={() => void loadSample()} className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">Load Sample Data</button><a href="/conversation-template.csv" download className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-600">Download CSV Template</a><div className="mt-5 border-t border-slate-100 pt-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Required column</p><code className="mt-2 block rounded-lg bg-slate-100 px-3 py-2 text-xs text-indigo-700">customer_message</code><p className="mt-3 text-xs leading-5 text-slate-500">Optional: conversation_id, date, chatbot_response, channel</p></div></aside>
    </div>
    {data && <Preview conversations={data.conversations} saving={saving} onContinue={() => void continueToAnalysis()} />}
  </div>;
}

function Preview({ conversations, saving, onContinue }: { conversations: Conversation[]; saving: boolean; onContinue: () => void }) {
  const rows = conversations.slice(0, 10);
  return <section className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><div className="flex items-center gap-2 text-emerald-700"><span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100"><Icon name="check" className="h-4 w-4" /></span><p className="text-sm font-semibold">Dataset ready for analysis</p></div><h2 className="mt-3 text-lg font-semibold text-slate-950">Conversation preview</h2><p className="mt-1 text-sm text-slate-500">Showing the first {rows.length} of {conversations.length.toLocaleString()} valid conversations.</p></div><div className="sm:text-right"><button type="button" onClick={onContinue} disabled={saving || conversations.length === 0} className="min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:bg-indigo-300">{saving ? "Saving dataset…" : "Continue to Analysis"}</button><p className="mt-1.5 text-xs text-slate-500">Saves this dataset on your device</p></div></div><div className="w-full overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">ID</th><th className="px-5 py-3 font-semibold">Customer Message</th><th className="px-5 py-3 font-semibold">Chatbot Response</th><th className="px-5 py-3 font-semibold">Date</th><th className="px-5 py-3 font-semibold">Channel</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row, index) => <tr key={`${row.id}-${index}`} className="align-top"><td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-500">{row.id}</td><td className="max-w-md px-5 py-4 leading-6 text-slate-800">{row.customerMessage}</td><td className="max-w-sm px-5 py-4 leading-6 text-slate-500">{row.chatbotResponse || "—"}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{row.date || "—"}</td><td className="whitespace-nowrap px-5 py-4 text-slate-500">{row.channel || "—"}</td></tr>)}</tbody></table></div></section>;
}

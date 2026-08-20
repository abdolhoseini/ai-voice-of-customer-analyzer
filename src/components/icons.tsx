import type { ReactNode } from "react";

export type IconName = "dashboard" | "import" | "analysis" | "insights" | "reports" | "conversations" | "sentiment" | "critical" | "issue" | "menu" | "upload" | "file" | "check" | "trash" | "lock";

const paths: Record<IconName, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  import: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
  analysis: <path d="M4 19V9m5 10V5m5 14v-7m5 7V3" />,
  insights: <><path d="M9 18h6m-5 3h4" /><path d="M8.3 15.5A7 7 0 1 1 15.7 15.5c-.8.5-1.2 1.3-1.2 2.5h-5c0-1.2-.4-2-1.2-2.5Z" /></>,
  reports: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h6m-6 4h6" /></>,
  conversations: <><path d="M21 15a4 4 0 0 1-4 4H8l-5 2 1.7-4.4A7 7 0 0 1 3 12V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /><path d="M8 10h8m-8 4h5" /></>,
  sentiment: <><circle cx="12" cy="12" r="9" /><path d="M8 16s1.5-2 4-2 4 2 4 2M9 9h.01M15 9h.01" /></>,
  critical: <><path d="M10.3 3.6 2.5 18a2 2 0 0 0 1.8 3h15.4a2 2 0 0 0 1.8-3L13.7 3.6a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
  issue: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></>,
  file: <><path d="M6 2h8l4 4v16H6z" /><path d="M14 2v5h5" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  trash: <><path d="M4 7h16m-10 4v6m4-6v6M9 7l1-3h4l1 3m3 0-1 14H7L6 7" /></>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
};

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

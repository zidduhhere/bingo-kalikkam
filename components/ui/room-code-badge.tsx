"use client";
import { useState } from "react";
export function RoomCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 px-6 py-4 dark:border-indigo-700 dark:bg-indigo-950/30">
      <span className="font-mono text-3xl font-bold tracking-widest text-indigo-700 dark:text-indigo-300">{code}</span>
      <button onClick={handleCopy} className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:text-indigo-400 dark:hover:bg-indigo-900/50">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

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
    <div className="flex flex-col items-center gap-1 rounded-xl border-[3px] border-dashed border-blue-900/40 bg-transparent px-6 py-4 [border-radius:255px_15px_225px_15px/15px_225px_15px_255px] rotate-[1deg]">
      <span className="font-mono text-5xl font-bold tracking-[0.25em] text-blue-900 mix-blend-multiply">{code}</span>
      <button onClick={handleCopy} className="rounded-md px-2 py-1 text-lg font-medium text-red-500 transition-colors hover:bg-red-500/10 [border-radius:15px_255px_15px_225px/255px_15px_225px_15px]">
        {copied ? "Copied!" : "Copy code"}
      </button>
    </div>
  );
}

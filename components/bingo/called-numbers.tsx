interface CalledNumbersProps { numbers: number[]; }
export function CalledNumbers({ numbers }: CalledNumbersProps) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Called Numbers</h3>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
        {numbers.length === 0 ? (
          <span className="text-sm text-zinc-400">None yet</span>
        ) : (
          numbers.map((n) => (
            <span key={n} className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-xs font-bold text-white">{n}</span>
          ))
        )}
      </div>
    </div>
  );
}

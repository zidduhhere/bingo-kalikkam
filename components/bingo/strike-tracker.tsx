interface StrikeTrackerProps { count: number; max?: number; }
export function StrikeTracker({ count, max = 5 }: StrikeTrackerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Strikes</span>
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <div key={i} className={`h-6 w-6 rounded-full border-2 transition-colors ${i < count ? "border-indigo-500 bg-indigo-500" : "border-zinc-300 dark:border-zinc-600"}`} />
        ))}
      </div>
    </div>
  );
}

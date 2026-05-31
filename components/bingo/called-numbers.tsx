interface CalledNumbersProps { numbers: number[]; }
export function CalledNumbers({ numbers }: CalledNumbersProps) {
  const last = numbers.length > 0 ? numbers[numbers.length - 1] : null;
  const previous = numbers.length > 1 ? numbers.slice(0, -1) : [];

  return (
    <div className="flex flex-col gap-3 mt-4">
      <h3 className="text-2xl font-bold text-blue-900 -rotate-1">Called Numbers</h3>

      {/* Last striker spotlight */}
      {last !== null && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600/80">Last Strike</span>
          <div className="relative flex items-center justify-center">
            {/* Glow ring */}
            <span className="absolute h-16 w-16 rounded-full bg-amber-400/30 animate-ping" />
            <span
              className="relative flex h-14 w-14 items-center justify-center border-[3px] border-amber-500 bg-amber-50 text-2xl font-black text-amber-700 shadow-[0_0_12px_3px_rgba(251,191,36,0.5)] rounded-[255px_15px_225px_15px/15px_225px_15px_255px] -rotate-1"
            >
              {last}
            </span>
          </div>
        </div>
      )}

      {/* All previous numbers */}
      {previous.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border-2 border-blue-900/20 bg-white/40 p-4 rounded-[15px_225px_15px_255px/255px_15px_225px_15px]">
          {previous.map((n) => (
            <span key={n} className="flex h-10 w-10 items-center justify-center border-2 border-red-600/60 bg-transparent text-xl font-bold text-red-700 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] rotate-1">
              {n}
            </span>
          ))}
        </div>
      )}

      {numbers.length === 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border-2 border-blue-900/20 bg-white/40 p-4 rounded-[15px_225px_15px_255px/255px_15px_225px_15px]">
          <span className="text-xl text-blue-900/50">None yet</span>
        </div>
      )}
    </div>
  );
}

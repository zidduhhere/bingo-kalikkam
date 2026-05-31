interface CalledNumbersProps { numbers: number[]; }
export function CalledNumbers({ numbers }: CalledNumbersProps) {
  return (
    <div className="flex flex-col gap-3 mt-4">
      <h3 className="text-2xl font-bold text-blue-900 rotate-[-1deg]">Called Numbers</h3>
      <div className="flex flex-wrap gap-2 rounded-xl border-2 border-blue-900/20 bg-white/40 p-4 [border-radius:15px_225px_15px_255px/255px_15px_225px_15px]">
        {numbers.length === 0 ? (
          <span className="text-xl text-blue-900/50">None yet</span>
        ) : (
          numbers.map((n) => (
            <span key={n} className="flex h-10 w-10 items-center justify-center border-2 border-red-600/60 bg-transparent text-xl font-bold text-red-700 [border-radius:255px_15px_225px_15px/15px_225px_15px_255px] rotate-[1deg]">
              {n}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

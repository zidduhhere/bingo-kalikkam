interface StrikeTrackerProps { count: number; max?: number; }
export function StrikeTracker({ count, max = 5 }: StrikeTrackerProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold text-blue-900/80 tracking-widest">STRIKES</span>
      <div className="flex gap-2">
        {Array.from({ length: max }, (_, i) => (
          <div key={i} className="relative h-8 w-8 flex items-center justify-center">
            {/* The underlying empty box/circle drawn with pen */}
            <div className="absolute inset-0 border-[2px] border-blue-900/30 [border-radius:255px_15px_225px_15px/15px_225px_15px_255px] rotate-[2deg]"></div>
            {/* The red strike if active */}
            {i < count && (
              <svg className="absolute inset-0 w-full h-full text-red-600 drop-shadow-sm scale-125" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 15,15 Q 50,45 85,85 M 85,15 Q 50,55 15,85" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

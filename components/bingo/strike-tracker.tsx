interface StrikeTrackerProps { count: number; max?: number; }
export function StrikeTracker({ count, max = 5 }: StrikeTrackerProps) {
  return (
    <div className="flex items-center gap-1.5 md:gap-2">
      <span className="text-xs md:text-sm font-black text-blue-900/80 tracking-widest mt-0.5">STRIKES</span>
      <div className="flex gap-1 md:gap-1.5">
        {Array.from({ length: max }, (_, i) => (
          <div key={i} className="relative h-6 w-6 flex items-center justify-center">
            {/* The underlying empty box/circle drawn with pen */}
            <div className="absolute inset-0 border-2 border-blue-900/30 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] rotate-2"></div>
            {/* The red strike if active */}
            {i < count && (
              <svg className="absolute inset-0 w-full h-full text-red-600 drop-shadow-sm scale-[1.35]" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 15,15 Q 50,45 85,85 M 85,15 Q 50,55 15,85" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

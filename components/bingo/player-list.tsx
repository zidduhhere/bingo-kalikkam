import { StrikeTracker } from "./strike-tracker";
import type { Player } from "@/lib/ws-types";
export function PlayerList({ players, currentUserId }: { players: Player[]; currentUserId: string }) {
  return (
    <div className="flex flex-col gap-4 p-4 border-[3px] border-blue-900/30 bg-white/50 backdrop-blur-sm rounded-[225px_15px_255px_15px/15px_255px_15px_225px] rotate-1 shadow-sm w-full">
      <h3 className="text-3xl font-black text-blue-950 underline decoration-blue-900/30 decoration-[3px] underline-offset-4">Scoreboard</h3>
      <ul className="flex flex-col gap-3">
        {players.map((p) => (
          <li key={p.id} className={`flex flex-col gap-2 rounded-xl border-2 px-3 py-3 ${p.id === currentUserId ? "border-red-400/50 bg-red-50/50" : "border-blue-900/10 bg-transparent"} rounded-[15px_255px_15px_225px/255px_15px_225px_15px]`}>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-2xl font-bold text-blue-900 break-all">{p.name}</span>
              {p.isComputer && <span className="font-sans rounded-full bg-blue-100/50 px-2 py-0.5 text-xs font-bold tracking-wider text-blue-600 border border-blue-200">CPU</span>}
              {p.id === currentUserId && <span className="font-sans rounded-full bg-red-100/50 px-2 py-0.5 text-xs font-bold tracking-wider text-red-600 border border-red-200">YOU</span>}
            </div>
            <div className="w-full pb-1">
              <StrikeTracker count={p.strikeCount} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

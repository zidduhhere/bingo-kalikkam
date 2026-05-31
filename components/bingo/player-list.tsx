import { StrikeTracker } from "./strike-tracker";
import type { Player } from "@/lib/ws-types";
export function PlayerList({ players, currentUserId }: { players: Player[]; currentUserId: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Players</h3>
      <ul className="flex flex-col gap-2">
        {players.map((p) => (
          <li key={p.id} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${p.id === currentUserId ? "border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950/30" : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"}`}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{p.name}</span>
              {p.isComputer && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">CPU</span>}
              {p.id === currentUserId && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-900/50">You</span>}
            </div>
            <StrikeTracker count={p.strikeCount} />
          </li>
        ))}
      </ul>
    </div>
  );
}

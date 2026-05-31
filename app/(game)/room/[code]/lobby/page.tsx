"use client";
import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0";
import { useGameContext } from "@/contexts/game-context";
import { RoomCodeBadge } from "@/components/ui/room-code-badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const router = useRouter();
  const { user } = useUser();
  const { state, send } = useGameContext();

  const isNew = code === "new";
  const userId = user?.sub ?? "";
  const userName = user?.name ?? "Player";

  useEffect(() => {
    if (!userId) return;
    if (isNew) {
      send({ type: "CREATE_ROOM", userId, userName, vsComputer: mode === "computer" });
    } else {
      send({ type: "JOIN_ROOM", roomCode: code, userId, userName });
    }
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isNew && state.roomCode) router.replace(`/room/${state.roomCode}/lobby`);
  }, [state.roomCode, isNew, router]);

  useEffect(() => {
    if (state.phase === "setup") router.push(`/room/${state.roomCode}/setup`);
  }, [state.phase, state.roomCode, router]);

  const isHost = state.players[0]?.id === userId;
  const displayCode = isNew ? "..." : code;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 p-6 dark:bg-zinc-950">
      <h1 className="text-2xl font-bold">Waiting Room</h1>
      <RoomCodeBadge code={displayCode} />
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <h2 className="text-sm font-semibold text-zinc-500">Players ({state.players.length})</h2>
        {state.players.length === 0 ? (
          <div className="flex items-center gap-2 text-zinc-400">
            <Spinner />
            <span className="text-sm">Waiting for players...</span>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {state.players.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                <span className="text-sm font-medium">{p.name}</span>
                {p.isComputer && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">CPU</span>}
                {p.id === userId && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-600">You</span>}
                {isHost && p.id === userId && <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-600">Host</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {isHost ? (
        <Button onClick={() => send({ type: "READY" })} disabled={state.players.length < 2} className="w-full max-w-sm py-3">
          Start Game
        </Button>
      ) : (
        <p className="text-sm text-zinc-400">Waiting for the host to start...</p>
      )}
    </div>
  );
}

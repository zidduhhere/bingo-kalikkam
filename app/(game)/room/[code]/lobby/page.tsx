"use client";
import { useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/components/user-provider";
import { useGameContext } from "@/contexts/game-context";
import { RoomCodeBadge } from "@/components/ui/room-code-badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useLanguage } from "@/components/language-provider";

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const router = useRouter();
  const { user } = useUser();
  const { state, actions } = useGameContext();
  const { lang } = useLanguage();

  const isNew = code === "new";
  const userId = user?.id ?? "";

  const hasSent = useRef(false);

  useEffect(() => {
    if (!userId || hasSent.current) return;
    hasSent.current = true;

    if (isNew) {
      actions.createRoom(mode === "computer");
    } else {
      actions.joinRoom(code);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (isNew && state.roomCode) router.replace(`/room/${state.roomCode}/lobby`);
  }, [state.roomCode, isNew, router]);

  useEffect(() => {
    if (state.phase === "setup") router.push(`/room/${code}/setup`);
  }, [state.phase, code, router]);

  const isHost = state.players[0]?.id === userId;
  const displayCode = state.roomCode || (isNew ? "..." : code);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 bg-transparent">
      {/* Back Button */}
      <button 
        onClick={() => router.push('/')}
        className="fixed top-4 left-4 z-50 p-2 md:p-3 text-blue-900/60 hover:text-blue-900 hover:bg-blue-900/10 rounded-full transition-colors font-(family-name:--font-caveat) flex items-center gap-2 text-xl"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        <span className="hidden md:inline">Back</span>
      </button>

      <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-zinc-200/50 text-center max-w-sm -rotate-1 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/salim-kumar-proud.gif" alt="Proud" className="w-40 rounded-xl border-2 border-blue-900/20 shadow-sm mix-blend-multiply" />
        <h1 className="text-4xl font-bold text-blue-900 font-(family-name:--font-caveat)">Room Lobby</h1>
      </div>
      <RoomCodeBadge code={displayCode} />
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <h2 className="text-xl font-semibold text-blue-900/70">Players ({state.players.length})</h2>
        {state.players.length === 0 ? (
          <div className="flex items-center gap-2 text-blue-900/50">
            <Spinner />
            <span className="text-lg">Waiting for players...</span>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {state.players.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border-2 border-blue-900/10 bg-white/40 px-4 py-3 shadow-sm rounded-[255px_15px_225px_15px/15px_225px_15px_255px]">
                <span className="text-xl font-medium text-blue-950">{p.name}</span>
                {p.isComputer && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600 font-sans">CPU</span>}
                {p.id === userId && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600 font-sans">You</span>}
                {isHost && p.id === userId && <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-600 font-sans">Host</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {state.players.length > 0 && (
        isHost ? (
          <Button onClick={() => actions.ready()} disabled={state.players.length < 2} className="w-full max-w-sm py-3 text-xl font-(family-name:--font-caveat)">
            {lang === "EN" ? "Start Game" : "baa kalikkam"}
          </Button>
        ) : (
          <p className="text-lg text-blue-900/60">Waiting for the host to start...</p>
        )
      )}
    </div>
  );
}

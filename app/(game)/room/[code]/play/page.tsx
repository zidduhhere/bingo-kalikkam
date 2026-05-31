"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useGameContext } from "@/contexts/game-context";
import { Grid } from "@/components/bingo/grid";
import { StrikeTracker } from "@/components/bingo/strike-tracker";
import { CalledNumbers } from "@/components/bingo/called-numbers";
import { PlayerList } from "@/components/bingo/player-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { detectStrikes } from "@/lib/bingo-logic";

export default function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { user } = useUser();
  const { state, send } = useGameContext();
  const [inputNumber, setInputNumber] = useState("");
  const [callError, setCallError] = useState("");

  const userId = user?.sub ?? "";
  const calledSet = new Set(state.calledNumbers);
  const myStrikes = detectStrikes(state.myGrid, calledSet);

  const handleCallNumber = () => {
    const n = parseInt(inputNumber, 10);
    if (isNaN(n) || n < 1 || n > 25) { setCallError("Enter a number between 1 and 25"); return; }
    if (state.calledNumbers.includes(n)) { setCallError("Number already called"); return; }
    send({ type: "CALL_NUMBER", number: n });
    setInputNumber("");
    setCallError("");
  };

  if (state.phase === "finished" && state.winner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-6 dark:bg-zinc-950">
        <div className="text-center">
          <div className="text-6xl mb-4">{state.winner.id === userId ? "🏆" : "😔"}</div>
          <h1 className="text-3xl font-black">{state.winner.id === userId ? "You Won!" : `${state.winner.name} Won!`}</h1>
        </div>
        <Button onClick={() => router.push("/")} className="w-48">Play Again</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 p-4 dark:bg-zinc-950 lg:flex-row lg:gap-6 lg:p-8">
      <div className="flex flex-col items-center gap-6 flex-1">
        <div className="flex items-center justify-between w-full max-w-xs">
          <h1 className="text-xl font-bold">Room: {code}</h1>
          <StrikeTracker count={myStrikes} />
        </div>
        <Grid grid={state.myGrid} calledNumbers={calledSet} />
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={25}
              placeholder="Call a number (1-25)"
              value={inputNumber}
              onChange={(e) => { setInputNumber(e.target.value); setCallError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCallNumber()}
            />
            <Button onClick={handleCallNumber} disabled={!inputNumber}>Call</Button>
          </div>
          {callError && <p className="text-xs text-red-500">{callError}</p>}
        </div>
        <CalledNumbers numbers={state.calledNumbers} />
      </div>
      <aside className="mt-6 lg:mt-0 lg:w-72">
        <PlayerList players={state.players} currentUserId={userId} />
      </aside>
    </div>
  );
}

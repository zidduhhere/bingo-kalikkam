"use client";
import { useState, useRef } from "react";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/components/user-provider";
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
  const { state, actions } = useGameContext();
  const [inputNumber, setInputNumber] = useState("");
  const [callError, setCallError] = useState("");

  const userId = user?.id ?? "";
  const calledSet = new Set(state.calledNumbers);
  const myStrikes = state.myGrid.length === 5 ? detectStrikes(state.myGrid, calledSet) : 0;
  const isMyTurn = state.currentTurnId === userId;
  const cellRefs = useRef<(HTMLButtonElement | null)[][]>(Array.from({ length: 5 }, () => Array(5).fill(null)));

  const handleCallNumber = () => {
    const n = parseInt(inputNumber, 10);
    if (!isMyTurn) { setCallError("Not your turn!"); return; }
    if (isNaN(n) || n < 1 || n > 25) { setCallError("Enter a number between 1 and 25"); return; }
    if (state.calledNumbers.includes(n)) { setCallError("Number already called"); return; }
    actions.callNumber(n);
    setInputNumber("");
    setCallError("");
  };

  const handleCellClick = (r: number, c: number) => {
    const num = state.myGrid[r][c];
    if (!isMyTurn) {
      setCallError("Not your turn!");
      return;
    }
    if (calledSet.has(num)) {
      setCallError("Number already called");
      return;
    }
    actions.callNumber(num);
    setCallError("");
  };

  const handleCellKeyDown = (r: number, c: number, e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCellClick(r, c);
    } else if (e.key === "ArrowUp") {
      e.preventDefault(); if (r > 0) cellRefs.current[r - 1][c]?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault(); if (r < 4) cellRefs.current[r + 1][c]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault(); if (c > 0) cellRefs.current[r][c - 1]?.focus();
    } else if (e.key === "ArrowRight") {
      e.preventDefault(); if (c < 4) cellRefs.current[r][c + 1]?.focus();
    }
  };

  if (state.phase === "finished" && state.winner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 bg-transparent">
        <div className="text-center rotate-[-2deg] bg-white/70 p-8 rounded-3xl border border-zinc-200/50 shadow-xl backdrop-blur-sm">
          <div className="text-7xl mb-4">{state.winner.id === userId ? "🏆" : "😔"}</div>
          <h1 className="text-5xl font-black text-blue-900 drop-shadow-sm">{state.winner.id === userId ? "You Won!" : `${state.winner.name} Won!`}</h1>
        </div>
        <Button onClick={() => router.push("/")} className="w-48 text-xl">Play Again</Button>
      </div>
    );
  }

  if (state.phase !== "playing" && state.phase !== "finished") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 bg-transparent">
        <div className="text-center rotate-[1deg] bg-white/50 p-8 rounded-2xl">
          <h1 className="text-4xl font-bold text-blue-900 animate-pulse">Waiting for opponent...</h1>
          <p className="mt-2 text-xl text-blue-800/80">The game will start once everyone has arranged their board.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-4 lg:flex-row lg:gap-6 lg:p-8 bg-transparent">
      <div className="flex flex-col items-center gap-6 flex-1">
        <div className="flex items-center justify-between w-full max-w-xs">
          <h1 className="text-xl font-bold">Room: {code}</h1>
          <StrikeTracker count={myStrikes} />
        </div>
        <Grid 
          grid={state.myGrid} 
          calledNumbers={calledSet} 
          onCellClick={handleCellClick}
          onCellKeyDown={handleCellKeyDown}
          buttonRefs={cellRefs}
        />
        <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
          <div className={`text-2xl font-bold text-center mb-1 ${isMyTurn ? "text-red-600 animate-pulse" : "text-blue-900/50"}`}>
            {isMyTurn ? "🎯 Your turn!" : "⏳ Waiting for opponent..."}
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={25}
              placeholder="Call a number (1-25)"
              value={inputNumber}
              disabled={!isMyTurn}
              onChange={(e) => { setInputNumber(e.target.value); setCallError(""); }}
              onKeyDown={(e) => e.key === "Enter" && isMyTurn && handleCallNumber()}
            />
            <Button onClick={handleCallNumber} disabled={!isMyTurn || !inputNumber}>Call</Button>
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

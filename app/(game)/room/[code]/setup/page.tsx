"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useGameContext } from "@/contexts/game-context";
import { Grid } from "@/components/bingo/grid";
import { Button } from "@/components/ui/button";
import { shuffle, range } from "@/lib/utils";
import React, { useState, useRef, useEffect } from "react";

export default function SetupPage() {
  const { code } = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { state, actions, setMyGrid } = useGameContext();
  const mode = searchParams.get("mode");
  const hasCreated = useRef(false);

  useEffect(() => {
    if (code === "local" && mode === "computer" && !state.roomCode && !hasCreated.current) {
      hasCreated.current = true;
      actions.createRoom(true);
    }
  }, [code, mode, state.roomCode, actions]);

  useEffect(() => {
    if (state.phase === "playing") {
      router.push(`/room/${code}/play`);
    }
  }, [state.phase, code, router]);

  const [grid, setGrid] = useState<number[][]>(() => 
    Array.from({ length: 5 }, () => Array(5).fill(0))
  );
  const [isConfirmed, setIsConfirmed] = useState(false);
  const cellRefs = useRef<(HTMLInputElement | null)[][]>(Array.from({ length: 5 }, () => Array(5).fill(null)));

  const handleShuffle = () => {
    const nums = shuffle(range(25));
    setGrid(Array.from({ length: 5 }, (_, r) => nums.slice(r * 5, r * 5 + 5)));
  };

  const handleClear = () => {
    setGrid(Array.from({ length: 5 }, () => Array(5).fill(0)));
  };

  const focusNext = (r: number, c: number) => {
    let nextR = r;
    let nextC = c + 1;
    if (nextC > 4) {
      nextC = 0;
      nextR = r + 1;
    }
    if (nextR > 4) return;
    cellRefs.current[nextR][nextC]?.focus();
  };

  const focusPrev = (r: number, c: number) => {
    let prevR = r;
    let prevC = c - 1;
    if (prevC < 0) {
      prevC = 4;
      prevR = r - 1;
    }
    if (prevR < 0) return;
    cellRefs.current[prevR][prevC]?.focus();
  };

  const handleCellChange = (r: number, c: number, val: string) => {
    if (val === "") {
       const newGrid = [...grid.map(row => [...row])];
       newGrid[r][c] = 0;
       setGrid(newGrid);
       return;
    }
    
    if (!/^\d+$/.test(val)) return;

    const n = parseInt(val, 10);
    
    const newGrid = [...grid.map(row => [...row])];
    newGrid[r][c] = n;
    setGrid(newGrid);

    if (val.length === 2) {
      focusNext(r, c);
    }
  };

  const focusUp = (r: number, c: number) => {
    if (r > 0) cellRefs.current[r - 1][c]?.focus();
  };

  const focusDown = (r: number, c: number) => {
    if (r < 4) cellRefs.current[r + 1][c]?.focus();
  };

  const focusLeft = (r: number, c: number) => {
    if (c > 0) cellRefs.current[r][c - 1]?.focus();
  };

  const focusRight = (r: number, c: number) => {
    if (c < 4) cellRefs.current[r][c + 1]?.focus();
  };

  const handleCellKeyDown = (r: number, c: number, e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter") {
       focusNext(r, c);
    } else if (e.key === "Backspace" && grid[r][c] === 0) {
       focusPrev(r, c);
    } else if (e.key === "ArrowUp") {
       e.preventDefault(); focusUp(r, c);
    } else if (e.key === "ArrowDown") {
       e.preventDefault(); focusDown(r, c);
    } else if (e.key === "ArrowLeft") {
       e.preventDefault(); focusLeft(r, c);
    } else if (e.key === "ArrowRight") {
       e.preventDefault(); focusRight(r, c);
    }
  };

  const getErrorMsg = () => {
    const seen = new Set<number>();
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const val = grid[r][c];
        if (val === 0) continue;
        if (val < 1 || val > 25) return "Numbers must be between 1 and 25";
        if (seen.has(val)) return `Number ${val} is duplicated`;
        seen.add(val);
      }
    }
    return "";
  };

  const errorMsg = getErrorMsg();
  const isComplete = grid.every(row => row.every(cell => cell !== 0)) && errorMsg === "";

  const handleConfirm = () => {
    if (!isComplete) return;
    setIsConfirmed(true);
    actions.submitGrid(grid);
    setMyGrid(grid);
  };

  if (isConfirmed && state.phase === "setup") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 bg-transparent">
        <div className="bg-white/60 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-zinc-200/50 text-center max-w-sm flex flex-col items-center gap-4 rounded-[255px_15px_225px_15px/15px_225px_15px_255px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/salim-kumar-proud.gif" alt="Waiting" className="w-32 rounded-xl border-2 border-blue-900/20 shadow-sm mix-blend-multiply" />
          <h2 className="text-3xl font-bold text-blue-900 font-(family-name:--font-caveat)">Board Locked!</h2>
          <p className="text-lg text-blue-800/70">Waiting for opponents to confirm their boards...</p>
          <div className="flex gap-1 mt-2">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{animationDelay: `${i * 0.15}s`}} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6 bg-transparent">
      <div className="text-center max-w-sm -rotate-1">
        <h1 className="text-4xl font-bold text-blue-900 drop-shadow-sm">Arrange Your Board</h1>
        <p className="mt-2 text-lg text-blue-800/80">Tap a cell to enter a number (1-25). Type a 2-digit number or hit Enter to skip to the next cell.</p>
      </div>

      <div className="h-6 flex items-center justify-center">
        {errorMsg && <p className="text-sm font-medium text-red-500">{errorMsg}</p>}
      </div>

      <Grid 
        grid={grid} 
        calledNumbers={new Set()} 
        isEditing={true} 
        onCellChange={handleCellChange}
        onCellKeyDown={handleCellKeyDown}
        cellRefs={cellRefs}
      />
      
      <div className="flex gap-3 w-full max-w-xs mt-4">
        <Button variant="outline" onClick={handleClear} className="flex-1">Clear</Button>
        <Button variant="secondary" onClick={handleShuffle} className="flex-1">Randomize</Button>
      </div>
      
      <div className="w-full max-w-xs mt-2">
        <Button onClick={handleConfirm} disabled={!isComplete} className="w-full">Confirm Board</Button>
      </div>
    </div>
  );
}

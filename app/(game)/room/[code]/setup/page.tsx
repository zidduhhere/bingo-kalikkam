"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameContext } from "@/contexts/game-context";
import { Grid } from "@/components/bingo/grid";
import { Button } from "@/components/ui/button";
import { shuffle, range } from "@/lib/utils";

export default function SetupPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { send, setMyGrid } = useGameContext();

  const [grid, setGrid] = useState<number[][]>(() => {
    const nums = shuffle(range(25));
    return Array.from({ length: 5 }, (_, r) => nums.slice(r * 5, r * 5 + 5));
  });

  const handleShuffle = () => {
    const nums = shuffle(range(25));
    setGrid(Array.from({ length: 5 }, (_, r) => nums.slice(r * 5, r * 5 + 5)));
  };

  const handleConfirm = () => {
    send({ type: "SUBMIT_GRID", grid });
    setMyGrid(grid);
    router.push(`/room/${code}/play`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Arrange Your Board</h1>
        <p className="mt-1 text-sm text-zinc-500">Your opponent won't see the number positions.</p>
      </div>
      <Grid grid={grid} calledNumbers={new Set()} />
      <div className="flex gap-3 w-full max-w-xs">
        <Button variant="ghost" onClick={handleShuffle} className="flex-1">Shuffle</Button>
        <Button onClick={handleConfirm} className="flex-1">Confirm Board</Button>
      </div>
    </div>
  );
}

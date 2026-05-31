"use client";
import { createContext, useContext } from "react";
import { useGame } from "@/hooks/use-game";
import type { ClientMessage, GameState } from "@/lib/ws-types";

interface GameContextValue {
  state: GameState;
  send: (msg: ClientMessage) => void;
  setMyGrid: (grid: number[][]) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const game = useGame(userId);
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameContext must be used within GameProvider");
  return ctx;
}

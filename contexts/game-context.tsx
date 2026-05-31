"use client";
import { createContext, useContext } from "react";
import { useGame, type GameActions } from "@/hooks/use-game";
import type { GameState } from "@/lib/ws-types";

interface GameContextValue {
  state: GameState;
  actions: GameActions;
  setMyGrid: (grid: number[][]) => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  children,
  userId,
  userName,
}: {
  children: React.ReactNode;
  userId: string;
  userName: string;
}) {
  const game = useGame(userId, userName);
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>;
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameContext must be used within GameProvider");
  return ctx;
}

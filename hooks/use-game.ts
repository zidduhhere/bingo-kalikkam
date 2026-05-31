"use client";
import { useState, useCallback } from "react";
import { useWebSocket } from "./use-websocket";
import { detectStrikes } from "@/lib/bingo-logic";
import type { ServerMessage, ClientMessage, GameState } from "@/lib/ws-types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

const INITIAL_STATE: GameState = {
  roomCode: "",
  phase: "lobby",
  players: [],
  calledNumbers: [],
  myGrid: [],
  winner: null,
};

export function useGame(userId: string) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  const handleMessage = useCallback((msg: ServerMessage) => {
    setState((prev) => {
      switch (msg.type) {
        case "ROOM_CREATED":
          return { ...prev, roomCode: msg.roomCode };
        case "PLAYER_JOINED":
          return { ...prev, players: msg.players };
        case "PLAYER_LEFT":
          return { ...prev, players: prev.players.filter((p) => p.id !== msg.userId) };
        case "GAME_STARTED":
          return { ...prev, phase: "setup" };
        case "NUMBER_CALLED": {
          const calledNumbers = [...prev.calledNumbers, msg.number];
          const calledSet = new Set(calledNumbers);
          const strikes = detectStrikes(prev.myGrid, calledSet);
          const players = prev.players.map((p) =>
            p.id === userId ? { ...p, strikeCount: strikes } : p
          );
          return { ...prev, calledNumbers, players };
        }
        case "STRIKE": {
          const players = prev.players.map((p) =>
            p.id === msg.userId ? { ...p, strikeCount: msg.strikeCount } : p
          );
          return { ...prev, players };
        }
        case "GAME_OVER": {
          const winner = prev.players.find((p) => p.id === msg.winnerId) ?? null;
          return { ...prev, phase: "finished", winner };
        }
        default:
          return prev;
      }
    });
  }, [userId]);

  const { send } = useWebSocket(WS_URL, { onMessage: handleMessage });

  const setMyGrid = useCallback((grid: number[][]) => {
    setState((prev) => ({ ...prev, myGrid: grid, phase: "playing" }));
  }, []);

  return { state, send, setMyGrid };
}

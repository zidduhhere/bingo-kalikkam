"use client";
import { useState, useCallback, useRef } from "react";
import { useRealtime } from "./use-realtime";
import { detectStrikes } from "@/lib/bingo-logic";
import type { GameState, Player } from "@/lib/ws-types";

// ─── helpers ────────────────────────────────────────────────────────────────

function randomRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function randomGrid(): number[][] {
  const nums = Array.from({ length: 25 }, (_, i) => i + 1).sort(
    () => Math.random() - 0.5
  );
  return Array.from({ length: 5 }, (_, i) => nums.slice(i * 5, i * 5 + 5));
}

// ─── types ───────────────────────────────────────────────────────────────────

export interface GameActions {
  createRoom: (vsComputer: boolean) => void;
  joinRoom: (roomCode: string) => void;
  ready: () => void;
  submitGrid: (grid: number[][]) => void;
  callNumber: (n: number) => void;
}

// ─── initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: GameState = {
  roomCode: "",
  phase: "lobby",
  players: [],
  calledNumbers: [],
  myGrid: [],
  winners: [],
  currentTurnId: null,
};

// ─── hook ────────────────────────────────────────────────────────────────────

export function useGame(userId: string, userName: string) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);

  // We need a ref so publish can always see the latest state without re-creating actions
  const stateRef = useRef(state);
  stateRef.current = state;

  // roomCode drives the realtime subscription — starts empty, set on CREATE/JOIN
  const [activeRoomCode, setActiveRoomCode] = useState("");

  // ── event handler ─────────────────────────────────────────────────────────

  // Declare publish early so it can be used in the event handler via ref or directly if hoisted
  // Wait, handleEvent is passed to useRealtime, so we can't easily call publish from inside it unless we use a ref.
  // Instead, let's just use the state reducer to compute the new state, and if we are the host, we trigger a broadcast from an effect.
  // Or better, let's just make the event handler async and not use the setState callback for everything, but read from stateRef!

  const handleEvent = useCallback(
    async (event: string, payload: Record<string, unknown>) => {
      const prev = stateRef.current;
      let nextState = prev;

      switch (event) {
        case "ROOM_CREATED": {
          const code = payload.roomCode as string;
          setActiveRoomCode(code);
          nextState = { ...prev, roomCode: code };
          break;
        }

        case "PLAYER_JOINED": {
          if (payload.joining) {
            const joiningId = payload.userId as string;
            if (prev.players.find((p) => p.id === joiningId)) break;
            
            const newPlayer: Player = {
              id: joiningId,
              name: payload.userName as string,
              isComputer: false,
              isReady: false,
              strikeCount: 0,
            };
            const newPlayers = [...prev.players, newPlayer];
            nextState = { ...prev, players: newPlayers };
            break;
          } else {
            nextState = { ...prev, players: payload.players as Player[] };
            break;
          }
        }

        case "PLAYER_LEFT": {
          nextState = {
            ...prev,
            players: prev.players.filter((p) => p.id !== (payload.userId as string)),
          };
          break;
        }

        case "GAME_STARTED":
          nextState = { ...prev, phase: "setup" };
          break;

        case "GAME_START_PLAYING":
          nextState = {
            ...prev,
            phase: "playing",
            currentTurnId: payload.currentTurnId as string,
          };
          break;

        case "NUMBER_CALLED": {
          const number = payload.number as number;
          const nextTurnId = payload.nextTurnId as string;
          const calledNumbers = [...prev.calledNumbers, number];
          const calledSet = new Set(calledNumbers);
          const strikes = detectStrikes(prev.myGrid, calledSet);
          const players = prev.players.map((p) =>
            p.id === userId ? { ...p, strikeCount: strikes } : p
          );
          nextState = { ...prev, calledNumbers, players, currentTurnId: nextTurnId };
          break;
        }

        case "STRIKE": {
          const players = prev.players.map((p) =>
            p.id === (payload.userId as string)
              ? { ...p, strikeCount: payload.strikeCount as number }
              : p
          );
          nextState = { ...prev, players };
          break;
        }

        case "PLAYER_WON": {
          const winnerId = payload.winnerId as string;
          const winnerPlayer = prev.players.find(p => p.id === winnerId);
          if (winnerPlayer && !prev.winners.find(w => w.id === winnerId)) {
            const newWinners = [...prev.winners, winnerPlayer];
            nextState = { ...prev, winners: newWinners };
            
            // Check if game should end
            if (prev.players.length > 1 && prev.players.length - newWinners.length <= 1) {
              nextState.phase = "finished";
              nextState.currentTurnId = null;
            } else if (prev.players.length === 1 && newWinners.length === 1) {
              nextState.phase = "finished";
              nextState.currentTurnId = null;
            }
          }
          break;
        }

        case "GAME_OVER": {
          nextState = { ...prev, phase: "finished", currentTurnId: null };
          break;
        }

        case "ERROR":
          console.error("[Game] server error:", payload.message);
          break;
      }

      setState(nextState);

      // If we are the host and a new player joined, broadcast the updated full player list
      if (event === "PLAYER_JOINED" && payload.joining && prev.players[0]?.id === userId) {
        const publishFn = publishRef.current;
        if (publishFn) {
          await publishFn("PLAYER_JOINED", { players: nextState.players });
        }
      }
    },
    [userId]
  );

  const { publish } = useRealtime({
    roomCode: activeRoomCode,
    onEvent: handleEvent,
    enabled: !!userId,
  });

  const publishRef = useRef(publish);
  publishRef.current = publish;

  // Store grids for computer + self (needed for strike evaluation)
  const gridsRef = useRef<Record<string, number[][]>>({});

  // ── actions ───────────────────────────────────────────────────────────────

  const createRoom = useCallback(
    async (vsComputer: boolean) => {
      const roomCode = randomRoomCode();
      const channel = `bingo:${roomCode}`;
      setActiveRoomCode(roomCode);
      setState((prev) => ({ ...prev, roomCode }));

      const humanPlayer: Player = {
        id: userId,
        name: userName,
        isComputer: false,
        isReady: false,
        strikeCount: 0,
      };
      const players: Player[] = [humanPlayer];

      if (vsComputer) {
        players.push({
          id: "computer",
          name: "Computer",
          isComputer: true,
          isReady: true,
          strikeCount: 0,
        });
      }

      await publish("ROOM_CREATED", { roomCode }, channel);
      await publish("PLAYER_JOINED", {
        players: players.map((p) => ({ ...p })),
        currentTurnId: userId,
      }, channel);
    },
    [userId, userName, publish]
  );

  const joinRoom = useCallback(
    async (roomCode: string) => {
      const channel = `bingo:${roomCode}`;
      setActiveRoomCode(roomCode);
      setState((prev) => ({ ...prev, roomCode }));
      await publish("PLAYER_JOINED", {
        userId,
        userName,
        joining: true,
      }, channel);
    },
    [userId, userName, publish]
  );

  const ready = useCallback(async () => {
    await publish("GAME_STARTED", {});
  }, [publish]);

  const submitGrid = useCallback(
    async (grid: number[][]) => {
      gridsRef.current[userId] = grid;
      setState((prev) => ({ ...prev, myGrid: grid }));

      const cur = stateRef.current;
      // Check if computer also needs a grid
      const computer = cur.players.find((p) => p.isComputer);
      let allReady = true;
      const updatedPlayers = cur.players.map((p) => {
        if (p.id === userId) return { ...p, isReady: true };
        if (p.isComputer && !gridsRef.current["computer"]) {
          const cGrid = randomGrid();
          gridsRef.current["computer"] = cGrid;
          return { ...p, isReady: true };
        }
        return p;
      });

      for (const p of updatedPlayers) {
        if (!p.isReady && !p.isComputer) allReady = false;
      }

      await publish("PLAYER_JOINED", { players: updatedPlayers });

      if (computer || allReady) {
        // Broadcast start — in single-player vs computer mode, the host fires this
        const firstTurnId = updatedPlayers[0].id;
        await publish("GAME_START_PLAYING", {
          currentTurnId: firstTurnId,
        });
      }
    },
    [userId, publish]
  );

  const callNumber = useCallback(
    async (n: number) => {
      const cur = stateRef.current;
      if (cur.phase !== "playing" || cur.winner) return;
      if (cur.currentTurnId !== userId) return;
      if (cur.calledNumbers.includes(n)) return;

      const players = cur.players;
      let currentIndex = players.findIndex((p) => p.id === cur.currentTurnId);
      let nextIndex = currentIndex;
      let attempts = 0;
      do {
        nextIndex = (nextIndex + 1) % players.length;
        attempts++;
      } while (cur.winners.some(w => w.id === players[nextIndex].id) && attempts < players.length);
      const nextTurnId = players[nextIndex].id;

      await publish("NUMBER_CALLED", {
        number: n,
        calledBy: userId,
        nextTurnId,
      });

      // Evaluate self strikes
      const newCalled = [...cur.calledNumbers, n];
      const calledSet = new Set(newCalled);

      // Each player evaluates and broadcasts their own strikes
      if (gridsRef.current[userId]) {
        const strikes = detectStrikes(gridsRef.current[userId], calledSet);
        const myPlayer = players.find((p) => p.id === userId);
        if (myPlayer && strikes !== myPlayer.strikeCount) {
          await publish("STRIKE", {
            userId,
            strikeCount: strikes,
            line: [],
          });
          if (strikes >= 5 && !cur.winners.find(w => w.id === userId)) {
            await publish("PLAYER_WON", { winnerId: userId, winnerName: userName });
            // Let the event handler handle GAME_OVER state transitions
          }
        }
      }

      // Computer's turn
      const nextPlayer = players[nextIndex];
      if (nextPlayer?.isComputer) {
        setTimeout(async () => {
          const latestState = stateRef.current;
          if (latestState.winner || latestState.currentTurnId !== "computer") return;

          const usedNumbers = new Set(latestState.calledNumbers);
          let num: number;
          do {
            num = Math.floor(Math.random() * 25) + 1;
          } while (usedNumbers.has(num));

          const compPlayers = latestState.players;
          let compIndex = compPlayers.findIndex((p) => p.id === "computer");
          let compNextIndex = compIndex;
          let compAttempts = 0;
          do {
            compNextIndex = (compNextIndex + 1) % compPlayers.length;
            compAttempts++;
          } while (latestState.winners.some(w => w.id === compPlayers[compNextIndex].id) && compAttempts < compPlayers.length);
          const compNextTurnId = compPlayers[compNextIndex].id;

          await publish("NUMBER_CALLED", {
            number: num,
            calledBy: "computer",
            nextTurnId: compNextTurnId,
          });

          // Evaluate computer strikes
          const compCalled = new Set([...latestState.calledNumbers, num]);
          if (gridsRef.current["computer"]) {
            const compStrikes = detectStrikes(gridsRef.current["computer"], compCalled);
            const compPlayer = compPlayers.find((p) => p.isComputer);
            if (compPlayer && compStrikes !== compPlayer.strikeCount) {
              await publish("STRIKE", {
                userId: "computer",
                strikeCount: compStrikes,
                line: [],
              });
              if (compStrikes >= 5 && !latestState.winners.find(w => w.id === "computer")) {
                await publish("PLAYER_WON", { winnerId: "computer", winnerName: "Computer" });
              }
            }
          }
        }, 1500);
      }
    },
    [userId, userName, publish]
  );

  const actions: GameActions = {
    createRoom,
    joinRoom,
    ready,
    submitGrid,
    callNumber,
  };

  const setMyGrid = useCallback((grid: number[][]) => {
    gridsRef.current[userId] = grid;
    setState((prev) => ({ ...prev, myGrid: grid }));
  }, [userId]);

  return { state, actions, setMyGrid };
}

"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRealtime } from "./use-realtime";
import { detectStrikes } from "@/lib/bingo-logic";
import type { GameState, Player, Difficulty } from "@/lib/ws-types";
import { getBestComputerMove } from "@/lib/bingo-ai";
import { insforge } from "@/lib/insforge";

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
  setDifficulty: (difficulty: Difficulty) => void;
  requestPlayAgain: () => void;
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
  difficulty: "normal",
  playAgainRequests: [],
};

// ─── hook ────────────────────────────────────────────────────────────────────

export function useGame(userId: string, userName: string) {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const isLocalGame = useRef(false);

  // We need a ref so publish can always see the latest state without re-creating actions
  const stateRef = useRef(state);
  stateRef.current = state;

  // roomCode drives the realtime subscription — starts empty, set on CREATE/JOIN
  const [activeRoomCode, setActiveRoomCode] = useState("");

  // Load from local storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sessionStr = localStorage.getItem("bingo_session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (Date.now() - session.lastUpdated < 60000 && session.state.roomCode) {
          if (window.location.pathname.includes(session.state.roomCode) || session.state.roomCode === "LOCAL") {
            setState(session.state);
            setActiveRoomCode(session.state.roomCode);
            if (session.grids) {
              gridsRef.current = session.grids;
            }
            if (session.isLocalGame) {
              isLocalGame.current = session.isLocalGame;
            }
          }
        } else {
          localStorage.removeItem("bingo_session");
        }
      } catch (e) {
        console.error("Failed to parse bingo session", e);
      }
    }
  }, []);

  // Save to local storage on state change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state.roomCode) {
      localStorage.setItem("bingo_session", JSON.stringify({
        lastUpdated: Date.now(),
        state,
        grids: gridsRef.current,
        isLocalGame: isLocalGame.current
      }));
    }
  }, [state]);

  const previousStrikes = useRef<Record<string, number>>({});

  // Reset previous strikes when not playing
  useEffect(() => {
    if (state.phase === "setup" || state.phase === "lobby") {
      previousStrikes.current = {};
    }
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "playing") return;
    
    state.players.forEach(p => {
      // In multiplayer, only evaluate my own player to avoid duplicate broadcasts.
      // In local mode, evaluate all players (including computer).
      if (!isLocalGame.current && p.id !== userId) return;

      const prev = previousStrikes.current[p.id] || 0;
      if (p.strikeCount > prev) {
        previousStrikes.current[p.id] = p.strikeCount;
        
        // Execute sequentially to prevent websocket rapid-fire race conditions
        (async () => {
          try {
            await publishRef.current("STRIKE", {
              userId: p.id,
              strikeCount: p.strikeCount,
              line: [],
            });
            
            if (p.strikeCount >= 5 && !state.winners.find(w => w.id === p.id)) {
              await publishRef.current("PLAYER_WON", { winnerId: p.id, winnerName: p.name });
            }
          } catch (e) {
            console.error("Failed to publish strike/won events", e);
          }
        })();
      }
    });
  }, [state.players, state.phase, state.winners, userId]);

  // ── event handler ─────────────────────────────────────────────────────────

  // Declare publish early so it can be used in the event handler via ref or directly if hoisted
  // Wait, handleEvent is passed to useRealtime, so we can't easily call publish from inside it unless we use a ref.
  // Instead, let's just use the state reducer to compute the new state, and if we are the host, we trigger a broadcast from an effect.
  // Or better, let's just make the event handler async and not use the setState callback for everything, but read from stateRef!

  // Store grids for computer + self (needed for strike evaluation)
  const gridsRef = useRef<Record<string, number[][]>>({});

  const handleEvent = useCallback(
    async (event: string, payload: Record<string, unknown>) => {
      setState((prevReactState) => {
        let nextState = prevReactState;

        switch (event) {
          case "ROOM_CREATED": {
            const code = payload.roomCode as string;
            setActiveRoomCode(code);
            nextState = { ...prevReactState, roomCode: code };
            break;
          }

          case "PLAYER_JOINED": {
            if (payload.joining) {
              const joiningId = payload.userId as string;
              if (prevReactState.players.find((p) => p.id === joiningId)) break;
              
              const newPlayer: Player = {
                id: joiningId,
                name: payload.userName as string,
                isComputer: false,
                isReady: false,
                strikeCount: 0,
              };
              const newPlayers = [...prevReactState.players, newPlayer];
              nextState = { ...prevReactState, players: newPlayers };
              break;
            } else {
              nextState = { ...prevReactState, players: payload.players as Player[] };
              break;
            }
          }

          case "PLAYER_LEFT": {
            nextState = {
              ...prevReactState,
              players: prevReactState.players.filter((p) => p.id !== (payload.userId as string)),
            };
            break;
          }

          case "GAME_STARTED":
            nextState = { ...prevReactState, phase: "setup" };
            break;

          case "GAME_START_PLAYING":
            nextState = {
              ...prevReactState,
              phase: "playing",
              currentTurnId: payload.currentTurnId as string,
            };
            break;

          case "NUMBER_CALLED": {
            const number = payload.number as number;
            const nextTurnId = payload.nextTurnId as string;
            const calledNumbers = [...prevReactState.calledNumbers, number];
            const calledSet = new Set(calledNumbers);
            const players = prevReactState.players.map((p) => {
              const grid = gridsRef.current[p.id];
              if (grid) {
                const strikes = detectStrikes(grid, calledSet);
                return { ...p, strikeCount: strikes };
              }
              return p;
            });
            nextState = { ...prevReactState, calledNumbers, players, currentTurnId: nextTurnId };
            break;
          }

          case "STRIKE": {
            const players = prevReactState.players.map((p) =>
              p.id === (payload.userId as string)
                ? { ...p, strikeCount: payload.strikeCount as number }
                : p
            );
            nextState = { ...prevReactState, players };
            break;
          }

          case "PLAYER_WON": {
            const winnerId = payload.winnerId as string;
            const winnerPlayer = prevReactState.players.find(p => p.id === winnerId);
            if (winnerPlayer && !prevReactState.winners.find(w => w.id === winnerId)) {
              const newWinners = [...prevReactState.winners, winnerPlayer];
              nextState = { ...prevReactState, winners: newWinners };
              
              if (prevReactState.players.length > 1 && prevReactState.players.length - newWinners.length <= 1) {
                nextState.phase = "finished";
                nextState.currentTurnId = null;
              } else if (prevReactState.players.length === 1 && newWinners.length === 1) {
                nextState.phase = "finished";
                nextState.currentTurnId = null;
              }

              if (nextState.phase === "finished" && userId && userId !== "computer") {
                const didWin = newWinners.some(w => w.id === userId);
                insforge.database.from("leaderboard").select("*").eq("user_id", userId).single().then(async ({ data }: any) => {
                  if (data) {
                    await insforge.database.from("leaderboard").update({
                      user_name: userName,
                      wins: didWin ? data.wins + 1 : data.wins,
                      losses: didWin ? data.losses : data.losses + 1
                    }).eq("user_id", userId);
                  } else {
                    await insforge.database.from("leaderboard").insert({
                      user_id: userId,
                      user_name: userName,
                      wins: didWin ? 1 : 0,
                      losses: didWin ? 0 : 1
                    });
                  }
                });
              }
            }
            break;
          }

          case "GAME_OVER":
            nextState = { ...prevReactState, phase: "finished", currentTurnId: null };
            break;

          case "GAME_OVER_GRIDS": {
            const grids = payload.grids as Record<string, number[][]>;
            nextState = {
              ...prevReactState,
              opponentGrids: { ...(prevReactState.opponentGrids || {}), ...grids }
            };
            break;
          }
          
          case "PLAY_AGAIN_REQUESTED": {
            const requestUserId = payload.userId as string;
            const currentRequests = prevReactState.playAgainRequests || [];
            if (!currentRequests.includes(requestUserId)) {
              nextState = { ...prevReactState, playAgainRequests: [...currentRequests, requestUserId] };
            }
            break;
          }

          case "GAME_RESET": {
            nextState = {
              ...INITIAL_STATE,
              roomCode: prevReactState.roomCode,
              players: prevReactState.players.map(p => ({ ...p, strikeCount: 0, isReady: false })),
              phase: "setup",
              difficulty: prevReactState.difficulty,
            };
            break;
          }

          case "ERROR":
            console.error("[Game] server error:", payload.message);
            break;

          case "DIFFICULTY_CHANGED":
            nextState = { ...prevReactState, difficulty: payload.difficulty as Difficulty };
            break;
        }

        // Update stateRef immediately so subsequent sync calls within the same tick see it
        stateRef.current = nextState;
        return nextState;
      });

      // If we are the host and a new player joined, broadcast the updated full player list
      // We read from stateRef because the state has been updated synchronously above
      if (event === "PLAYER_JOINED" && payload.joining && stateRef.current.players[0]?.id === userId) {
        const publishFn = publishRef.current;
        if (publishFn) {
          await publishFn("PLAYER_JOINED", { players: stateRef.current.players });
        }
      }

      // If the game just finished (or someone won ending the game), broadcast our grid
      if ((event === "PLAYER_WON" || event === "GAME_OVER") && stateRef.current.phase === "finished") {
        const publishFn = publishRef.current;
        if (publishFn) {
          await publishFn("GAME_OVER_GRIDS", { grids: gridsRef.current });
        }
      }
    },
    [userId]
  );

  const { publish: remotePublish } = useRealtime({
    roomCode: activeRoomCode,
    onEvent: handleEvent,
    enabled: !!userId && !isLocalGame.current,
  });

  const publish = useCallback(
    async (event: string, payload: Record<string, unknown>, overrideChannel?: string) => {
      if (isLocalGame.current) {
        handleEvent(event, payload);
      } else {
        await remotePublish(event, payload, overrideChannel);
      }
    },
    [handleEvent, remotePublish]
  );

  const publishRef = useRef(publish);
  publishRef.current = publish;

  // ── actions ───────────────────────────────────────────────────────────────

  const createRoom = useCallback(
    async (vsComputer: boolean) => {
      if (vsComputer) {
        isLocalGame.current = true;
      }
      const roomCode = vsComputer ? "LOCAL" : randomRoomCode();
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
      if (cur.phase !== "playing") return;
      if (cur.currentTurnId !== userId) return;
      if (cur.calledNumbers.includes(n)) return;

      const players = cur.players;
      const currentIndex = players.findIndex((p) => p.id === cur.currentTurnId);
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

      // Computer's turn
      const nextPlayer = players[nextIndex];
      if (nextPlayer?.isComputer) {
        setTimeout(async () => {
          const latestState = stateRef.current;
          if (latestState.phase !== "playing" || latestState.currentTurnId !== "computer") return;

          const usedNumbers = new Set(latestState.calledNumbers);
          const opponentGrid = latestState.players.find(p => !p.isComputer) ? gridsRef.current[latestState.players.find(p => !p.isComputer)!.id] : undefined;
          
          const num = getBestComputerMove(
            gridsRef.current["computer"]!,
            opponentGrid,
            latestState.calledNumbers,
            latestState.difficulty
          );

          if (num === -1) {
             console.warn("No available moves for computer.");
             return;
          }

          const compPlayers = latestState.players;
          const compIndex = compPlayers.findIndex((p) => p.id === "computer");
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
        }, Math.random() * 1000 + 1000);
      }
    },
    [userId, userName, publish]
  );

  const setDifficulty = useCallback(async (difficulty: Difficulty) => {
    await publish("DIFFICULTY_CHANGED", { difficulty });
  }, [publish]);

  const requestPlayAgain = useCallback(async () => {
    const cur = stateRef.current;
    if (cur.phase !== "finished") return;

    // Check if we will trigger a reset
    const humanPlayers = cur.players.filter(p => !p.isComputer);
    const currentRequests = cur.playAgainRequests || [];
    
    // If we are the last human needed
    const neededHumans = humanPlayers.filter(p => p.id !== userId && !currentRequests.includes(p.id));
    
    if (neededHumans.length === 0) {
      await publish("GAME_RESET", {});
    } else {
      await publish("PLAY_AGAIN_REQUESTED", { userId });
    }
  }, [userId, publish]);

  const actions: GameActions = {
    createRoom,
    joinRoom,
    ready,
    submitGrid,
    callNumber,
    setDifficulty,
    requestPlayAgain,
  };

  const setMyGrid = useCallback((grid: number[][]) => {
    gridsRef.current[userId] = grid;
    setState((prev) => ({ ...prev, myGrid: grid }));
  }, [userId]);

  return { state, actions, setMyGrid };
}

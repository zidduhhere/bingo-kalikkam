export type ClientMessage =
  | { type: "JOIN_ROOM"; roomCode: string; userId: string; userName: string }
  | { type: "CREATE_ROOM"; userId: string; userName: string; vsComputer: boolean }
  | { type: "SUBMIT_GRID"; grid: number[][] }
  | { type: "CALL_NUMBER"; number: number }
  | { type: "READY" };

export type ServerMessage =
  | { type: "ROOM_CREATED"; roomCode: string }
  | { type: "PLAYER_JOINED"; players: Player[] }
  | { type: "PLAYER_LEFT"; userId: string }
  | { type: "GAME_STARTED" }
  | { type: "NUMBER_CALLED"; number: number; calledBy: string }
  | { type: "STRIKE"; userId: string; strikeCount: number; line: number[] }
  | { type: "GAME_OVER"; winnerId: string; winnerName: string }
  | { type: "ERROR"; message: string };

export interface Player {
  id: string;
  name: string;
  image?: string;
  strikeCount: number;
  isComputer?: boolean;
  isReady: boolean;
}

export interface GameState {
  roomCode: string;
  phase: "lobby" | "setup" | "playing" | "finished";
  players: Player[];
  calledNumbers: number[];
  myGrid: number[][];
  winner: Player | null;
}

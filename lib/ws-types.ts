export type Difficulty = "normal" | "hard";

export type ServerMessage =
  | { type: "ROOM_CREATED"; roomCode: string }
  | { type: "PLAYER_JOINED"; players: Player[] }
  | { type: "PLAYER_LEFT"; userId: string }
  | { type: "GAME_STARTED" }
  | { type: "GAME_START_PLAYING"; currentTurnId: string }
  | { type: "NUMBER_CALLED"; number: number; calledBy: string; nextTurnId: string }
  | { type: "STRIKE"; userId: string; strikeCount: number; line: number[] }
  | { type: "PLAYER_WON"; winnerId: string; winnerName: string }
  | { type: "GAME_OVER" }
  | { type: "GAME_OVER_GRIDS"; grids: Record<string, number[][]> }
  | { type: "DIFFICULTY_CHANGED"; difficulty: "normal" | "hard" }
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
  winners: Player[];
  currentTurnId: string | null;
  difficulty: "normal" | "hard";
  opponentGrids?: Record<string, number[][]>;
}

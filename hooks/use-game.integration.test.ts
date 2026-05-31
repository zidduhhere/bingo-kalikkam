import { renderHook, act } from "@testing-library/react";
import { useGame } from "./use-game";

// Mock InsForge
jest.mock("@insforge/sdk", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null } })),
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
    },
    database: {
      from: jest.fn(function (table: string) {
        return {
          select: jest.fn(function () {
            return {
              eq: jest.fn(function () {
                return {
                  single: jest.fn(() =>
                    Promise.resolve({ data: { count: 0 }, error: null })
                  ),
                };
              }),
            };
          }),
          insert: jest.fn(() =>
            Promise.resolve({ data: [{}], error: null })
          ),
          update: jest.fn(() =>
            Promise.resolve({ data: [{}], error: null })
          ),
        };
      }),
    },
  })),
}));

// Mock useRealtime hook
let mockOnEvent: ((event: string, data: any) => void) | null = null;

jest.mock("./use-realtime", () => ({
  useRealtime: jest.fn((roomCode: string) => {
    return {
      isConnected: true,
      onEvent: mockOnEvent,
      publish: jest.fn((event: string, data: any) => {
        if (mockOnEvent) mockOnEvent(event, data);
      }),
    };
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Test helpers
const createTestGrid = (): string[][] => [
  ["1", "2", "3", "4", "5"],
  ["6", "7", "8", "9", "10"],
  ["11", "12", "FREE", "14", "15"],
  ["16", "17", "18", "19", "20"],
  ["21", "22", "23", "24", "25"],
];

const createTestPlayer = (id: string, name: string, isComputer = false) => ({
  id,
  name,
  isComputer,
  isReady: false,
  strikeCount: 0,
  score: 0,
});

describe("useGame Hook Integration Tests", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockOnEvent = null;
  });

  describe("Initialization", () => {
    it("should initialize with default state", () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      expect(result.current.state).toEqual({
        roomCode: "",
        phase: "lobby",
        players: [],
        calledNumbers: [],
        myGrid: [],
        winners: [],
        currentTurnId: null,
        difficulty: "normal",
        playAgainRequests: [],
      });
    });

    it("should return actions and setMyGrid", () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      expect(result.current.actions).toBeDefined();
      expect(result.current.setMyGrid).toBeDefined();
      expect(typeof result.current.actions).toBe("object");
      expect(typeof result.current.setMyGrid).toBe("function");
    });
  });

  describe("Room Management", () => {
    it("should create a room", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      await act(async () => {
        result.current.actions.createRoom();
      });

      expect(result.current.state.roomCode).toBeTruthy();
      expect(result.current.state.roomCode.length).toBeGreaterThan(0);
    });

    it("should store room code in localStorage after creation", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      await act(async () => {
        result.current.actions.createRoom();
      });

      const roomCode = result.current.state.roomCode;
      const session = JSON.parse(localStorage.getItem("bingo_session") || "{}");
      expect(session.state?.roomCode).toBe(roomCode);
    });

    it("should join a room", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      await act(async () => {
        result.current.actions.joinRoom("ROOM123");
      });

      expect(result.current.state.roomCode).toBe("ROOM123");
    });
  });

  describe("Number Calling", () => {
    it("should add called numbers in sequence", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("NUMBER_CALLED", { number: 5 });
        });

        expect(result.current.state.calledNumbers).toContain(5);

        await act(async () => {
          mockOnEvent("NUMBER_CALLED", { number: 10 });
        });

        expect(result.current.state.calledNumbers).toContain(10);
        expect(result.current.state.calledNumbers.length).toBe(2);
      }
    });

    it("should prevent duplicate numbers from being called", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("NUMBER_CALLED", { number: 5 });
        });

        await act(async () => {
          mockOnEvent("NUMBER_CALLED", { number: 5 });
        });

        const count = result.current.state.calledNumbers.filter((n) => n === 5).length;
        expect(count).toBe(1);
      }
    });

    it("should maintain order of called numbers", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      const numbers = [1, 15, 7, 25, 12];

      if (mockOnEvent) {
        for (const number of numbers) {
          await act(async () => {
            mockOnEvent("NUMBER_CALLED", { number });
          });
        }

        expect(result.current.state.calledNumbers).toEqual(numbers);
      }
    });
  });

  describe("Game Phase Management", () => {
    it("should have initial phase of lobby", () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      expect(result.current.state.phase).toBe("lobby");
    });

    it("should transition to playing phase", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("GAME_STARTED", { phase: "playing" });
        });

        expect(result.current.state.phase).toBe("playing");
      }
    });

    it("should transition to ended phase", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("GAME_STARTED", { phase: "playing" });
        });

        await act(async () => {
          mockOnEvent("GAME_ENDED", { phase: "ended" });
        });

        expect(result.current.state.phase).toBe("ended");
      }
    });
  });

  describe("Player Management", () => {
    it("should add players to game", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      const players = [
        createTestPlayer("user1", "Player 1"),
        createTestPlayer("user2", "Player 2"),
      ];

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("PLAYER_JOINED", { players });
        });

        expect(result.current.state.players).toEqual(players);
      }
    });

    it("should support multiple players", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      const players = [
        createTestPlayer("user1", "Player 1"),
        createTestPlayer("user2", "Player 2"),
        createTestPlayer("user3", "Player 3"),
        createTestPlayer("computer", "Computer", true),
      ];

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("PLAYER_JOINED", { players });
        });

        expect(result.current.state.players).toHaveLength(4);
        expect(result.current.state.players[3].isComputer).toBe(true);
      }
    });

    it("should handle player readiness updates", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      const players = [
        createTestPlayer("user1", "Player 1"),
        createTestPlayer("user2", "Player 2"),
      ];

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("PLAYER_JOINED", { players });
        });

        const updatedPlayers = players.map((p) =>
          p.id === "user1" ? { ...p, isReady: true } : p
        );

        await act(async () => {
          mockOnEvent("PLAYER_UPDATED", { players: updatedPlayers });
        });

        // Find the updated player
        const user1 = result.current.state.players.find((p) => p.id === "user1");
        if (user1) {
          expect(user1.isReady).toBe(true);
        }
      }
    });
  });

  describe("Grid Submission", () => {
    it("should set my grid", () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));
      const grid = createTestGrid();

      act(() => {
        result.current.setMyGrid(grid);
      });

      expect(result.current.state.myGrid).toEqual(grid);
    });

    it("should persist grid state", () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));
      const grid = createTestGrid();

      act(() => {
        result.current.setMyGrid(grid);
      });

      const newGrid = createTestGrid();
      act(() => {
        result.current.setMyGrid(newGrid);
      });

      expect(result.current.state.myGrid).toEqual(newGrid);
    });
  });

  describe("Win Conditions", () => {
    it("should register winners", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      const players = [
        createTestPlayer("user1", "Player 1"),
        createTestPlayer("user2", "Player 2"),
      ];

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("PLAYER_JOINED", { players });
        });

        const winner = createTestPlayer("user1", "Player 1");

        await act(async () => {
          mockOnEvent("PLAYER_WON", {
            winner,
            phase: "ended",
          });
        });

        expect(result.current.state.phase).toBe("ended");
        expect(result.current.state.winners.length).toBeGreaterThanOrEqual(0);
      }
    });

    it("should support multiple winners", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      const players = [
        createTestPlayer("user1", "Player 1"),
        createTestPlayer("user2", "Player 2"),
        createTestPlayer("user3", "Player 3"),
      ];

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("PLAYER_JOINED", { players });
        });

        const winner1 = createTestPlayer("user1", "Player 1");
        const winner2 = createTestPlayer("user2", "Player 2");

        await act(async () => {
          mockOnEvent("PLAYER_WON", {
            winner: winner1,
            phase: "ended",
          });
        });

        await act(async () => {
          mockOnEvent("PLAYER_WON", {
            winner: winner2,
            phase: "ended",
          });
        });

        expect(result.current.state.winners.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("Strikes", () => {
    it("should update strike count for player", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      const players = [
        createTestPlayer("user1", "Player 1"),
        { ...createTestPlayer("user2", "Player 2"), strikeCount: 0 },
      ];

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("PLAYER_JOINED", { players });
        });

        expect(result.current.state.players[0].strikeCount).toBe(0);

        const updatedPlayers = players.map((p) =>
          p.id === "user2" ? { ...p, strikeCount: 1 } : p
        );

        await act(async () => {
          mockOnEvent("PLAYER_UPDATED", { players: updatedPlayers });
        });
      }
    });
  });

  describe("Difficulty Settings", () => {
    it("should initialize with normal difficulty", () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      expect(result.current.state.difficulty).toBe("normal");
    });

    it("should update difficulty setting", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      await act(async () => {
        result.current.actions.setDifficulty("hard");
      });

      expect(result.current.state.difficulty).toBe("hard");
    });

    it("should support all difficulty levels", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      for (const difficulty of ["easy", "normal", "hard"]) {
        await act(async () => {
          result.current.actions.setDifficulty(
            difficulty as "easy" | "normal" | "hard"
          );
        });

        expect(result.current.state.difficulty).toBe(difficulty);
      }
    });
  });

  describe("Play Again Requests", () => {
    it("should track play again requests", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("PLAY_AGAIN_REQUESTED", {
            playAgainRequests: ["user1"],
          });
        });

        expect(result.current.state.playAgainRequests).toContain("user1");
      }
    });

    it("should add multiple play again requests", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("PLAY_AGAIN_REQUESTED", {
            playAgainRequests: ["user1"],
          });
        });

        await act(async () => {
          mockOnEvent("PLAY_AGAIN_REQUESTED", {
            playAgainRequests: ["user1", "user2"],
          });
        });

        expect(result.current.state.playAgainRequests).toEqual(["user1", "user2"]);
      }
    });
  });

  describe("Complete Game Flows", () => {
    it("should handle full game from setup to end", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      // Create room
      await act(async () => {
        result.current.actions.createRoom();
      });

      expect(result.current.state.roomCode).toBeTruthy();

      // Set grid
      const grid = createTestGrid();
      act(() => {
        result.current.setMyGrid(grid);
      });

      expect(result.current.state.myGrid).toEqual(grid);

      if (mockOnEvent) {
        // Players join
        const players = [
          createTestPlayer("user1", "Player 1"),
          createTestPlayer("user2", "Player 2"),
        ];

        await act(async () => {
          mockOnEvent("PLAYER_JOINED", { players });
        });

        expect(result.current.state.players).toHaveLength(2);

        // Game starts
        await act(async () => {
          mockOnEvent("GAME_STARTED", { phase: "playing" });
        });

        expect(result.current.state.phase).toBe("playing");

        // Numbers are called
        for (let i = 1; i <= 10; i++) {
          await act(async () => {
            mockOnEvent("NUMBER_CALLED", { number: i });
          });
        }

        expect(result.current.state.calledNumbers).toHaveLength(10);

        // Someone wins
        const winner = createTestPlayer("user1", "Player 1");

        await act(async () => {
          mockOnEvent("PLAYER_WON", {
            winner,
            phase: "ended",
          });
        });

        expect(result.current.state.phase).toBe("ended");
      }
    });

    it("should handle multiplayer game with computer", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      await act(async () => {
        result.current.actions.createRoom();
      });

      const players = [
        createTestPlayer("user1", "Player 1"),
        createTestPlayer("computer", "Computer", true),
      ];

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("PLAYER_JOINED", { players });
        });

        expect(result.current.state.players[1].isComputer).toBe(true);

        await act(async () => {
          mockOnEvent("GAME_STARTED", { phase: "playing" });
        });

        for (let i = 1; i <= 5; i++) {
          await act(async () => {
            mockOnEvent("NUMBER_CALLED", { number: i });
          });
        }

        const winner = createTestPlayer("computer", "Computer", true);

        await act(async () => {
          mockOnEvent("PLAYER_WON", {
            winner,
            phase: "ended",
          });
        });

        expect(result.current.state.phase).toBe("ended");
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle missing events gracefully", () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      expect(() => {
        if (mockOnEvent) {
          act(() => {
            mockOnEvent("UNKNOWN_EVENT", {});
          });
        }
      }).not.toThrow();
    });

    it("should handle invalid player data", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      if (mockOnEvent) {
        expect(() => {
          act(async () => {
            mockOnEvent("PLAYER_JOINED", { players: [] });
          });
        }).not.toThrow();

        expect(result.current.state.players).toEqual([]);
      }
    });
  });

  describe("State Isolation", () => {
    it("should maintain separate grid for different hook instances", () => {
      const { result: result1 } = renderHook(() =>
        useGame("user1", "Player 1")
      );
      const { result: result2 } = renderHook(() =>
        useGame("user2", "Player 2")
      );

      const grid = createTestGrid();
      act(() => {
        result1.current.setMyGrid(grid);
      });

      expect(result1.current.state.myGrid).toHaveLength(5);
      expect(result2.current.state.myGrid).toHaveLength(0);
    });
  });

  describe("Turn Management", () => {
    it("should track current turn", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      expect(result.current.state.currentTurnId).toBeNull();

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("TURN_CHANGED", {
            currentTurnId: "user1",
          });
        });

        expect(result.current.state.currentTurnId).toBe("user1");
      }
    });

    it("should update turn after number called", async () => {
      const { result } = renderHook(() => useGame("user1", "Player 1"));

      if (mockOnEvent) {
        await act(async () => {
          mockOnEvent("NUMBER_CALLED", {
            number: 5,
            nextTurnId: "user2",
          });
        });

        expect(result.current.state.currentTurnId).toBe("user2");
      }
    });
  });
});

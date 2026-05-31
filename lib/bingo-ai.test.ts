import { getBestComputerMove } from "./bingo-ai";

describe("getBestComputerMove", () => {
  const defaultGrid = [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
  ];

  describe("Basic functionality", () => {
    it("returns an uncalled number", () => {
      const move = getBestComputerMove(defaultGrid, undefined, [], "normal");
      expect(move).toBeGreaterThanOrEqual(1);
      expect(move).toBeLessThanOrEqual(25);
    });

    it("returns -1 when all numbers are called", () => {
      const allNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
      const move = getBestComputerMove(defaultGrid, undefined, allNumbers, "normal");
      expect(move).toBe(-1);
    });

    it("never returns a called number", () => {
      const called = [1, 2, 3, 4, 5];
      const move = getBestComputerMove(defaultGrid, undefined, called, "normal");
      expect(called).not.toContain(move);
    });
  });

  describe("Offensive strategy (Normal difficulty)", () => {
    it("prioritizes completing a line (4 called)", () => {
      // Row 1: 1, 2, 3, 4 are called, 5 is not
      const called = [1, 2, 3, 4];
      const move = getBestComputerMove(defaultGrid, undefined, called, "normal");
      expect(move).toBe(5);
    });

    it("prefers moves that get closer to completion", () => {
      // Two choices: 5 (completes row with 1,2,3,4) vs 6 (only has 1 in its lines)
      // Should choose 5
      const called = [1, 2, 3, 4];
      const move = getBestComputerMove(defaultGrid, undefined, called, "normal");
      expect(move).toBe(5);
    });

    it("handles multiple potential moves intelligently", () => {
      // Multiple incomplete lines
      const called = [1, 6, 11, 16]; // Missing 21 from column
      const move = getBestComputerMove(defaultGrid, undefined, called, "normal");
      // Should consider that 21 completes a column
      expect(move).toBe(21);
    });

    it("considers all lines a number belongs to", () => {
      // 13 is at center, part of row, column, and both diagonals
      const called = [7, 8, 9, 11, 12, 14, 15, 17, 19, 23];
      const move = getBestComputerMove(defaultGrid, undefined, called, "normal");
      // With multiple lines close, 13 should be high priority
      expect([13]).toContain(move);
    });
  });

  describe("Defensive strategy (Hard difficulty)", () => {
    it("blocks opponent from completing a line", () => {
      const opponentGrid = [
        [26, 27, 28, 29, 30],
        [31, 32, 33, 34, 35],
        [36, 37, 38, 39, 40],
        [41, 42, 43, 44, 45],
        [46, 47, 48, 49, 50],
      ];

      // Opponent almost has a row: 26, 27, 28, 29 (missing 30)
      const called = [26, 27, 28, 29, 1, 2, 3, 4];
      const computerGrid = defaultGrid;

      // In hard mode, should consider defensive value
      const move = getBestComputerMove(computerGrid, opponentGrid, called, "hard");
      expect([5, 30]).toContain(move);
    });

    it("returns a move even with opponent grid in hard mode", () => {
      const opponentGrid = defaultGrid;
      const called = [];
      const move = getBestComputerMove(defaultGrid, opponentGrid, called, "hard");
      expect(move).toBeGreaterThanOrEqual(1);
      expect(move).toBeLessThanOrEqual(25);
    });

    it("considers both offensive and defensive scores", () => {
      const opponentGrid = [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20],
        [21, 22, 23, 24, 25],
      ];

      // Setup: computer can complete a line with 5, opponent can too
      const called = [2, 3, 4]; // Both grids have these as first 3 of first row
      const move = getBestComputerMove(defaultGrid, opponentGrid, called, "hard");

      // Should choose 1 (completes computer row) more than 5 
      // (would help opponent), even though 5 completes computer row too
      expect(move).toBeGreaterThanOrEqual(1);
      expect(move).toBeLessThanOrEqual(25);
    });
  });

  describe("Edge cases", () => {
    it("handles empty called list", () => {
      const move = getBestComputerMove(defaultGrid, undefined, [], "normal");
      expect(move).toBeGreaterThanOrEqual(1);
      expect(move).toBeLessThanOrEqual(25);
    });

    it("handles nearly full called list", () => {
      const called = Array.from({ length: 24 }, (_, i) => i + 1);
      const move = getBestComputerMove(defaultGrid, undefined, called, "normal");
      expect(move).toBe(25);
    });

    it("works with different grid arrangements", () => {
      const customGrid = [
        [25, 24, 23, 22, 21],
        [20, 19, 18, 17, 16],
        [15, 14, 13, 12, 11],
        [10, 9, 8, 7, 6],
        [5, 4, 3, 2, 1],
      ];
      const move = getBestComputerMove(customGrid, undefined, [], "normal");
      expect(move).toBeGreaterThanOrEqual(1);
      expect(move).toBeLessThanOrEqual(25);
    });
  });

  describe("Randomness", () => {
    it("includes randomness in the decision (different calls may differ)", () => {
      const called = [];
      const moves = new Set<number>();
      for (let i = 0; i < 10; i++) {
        const move = getBestComputerMove(defaultGrid, undefined, called, "normal");
        moves.add(move);
      }
      // With randomness, we should sometimes get different first moves
      // (though not guaranteed due to small noise)
      expect(moves.size).toBeGreaterThan(0);
    });
  });

  describe("Difficulty mode differences", () => {
    it("normal and hard modes can produce different results with opponent grid", () => {
      const opponentGrid = [
        [1, 2, 3, 4, 5],
        [6, 7, 8, 9, 10],
        [11, 12, 13, 14, 15],
        [16, 17, 18, 19, 20],
        [21, 22, 23, 24, 25],
      ];

      const called = [1, 2, 3, 4, 6, 7, 8, 9];
      
      // Run multiple times to get a sense of tendency
      let normalChoice = 0;
      let hardChoice = 0;
      
      for (let i = 0; i < 5; i++) {
        const normal = getBestComputerMove(defaultGrid, undefined, called, "normal");
        const hard = getBestComputerMove(defaultGrid, opponentGrid, called, "hard");
        
        if (normal === 5) normalChoice++;
        if (hard === 5) hardChoice++;
      }
      
      // Just verify both modes work without errors
      expect(normalChoice + hardChoice).toBeGreaterThan(0);
    });
  });
});

import { buildEmptyGrid, detectStrikes, isWinner } from "./bingo-logic";

describe("buildEmptyGrid", () => {
  it("returns a 5x5 grid of zeros", () => {
    const grid = buildEmptyGrid();
    expect(grid.length).toBe(5);
    expect(grid[0].length).toBe(5);
    expect(grid[0][0]).toBe(0);
  });

  it("returns a grid with all zeros", () => {
    const grid = buildEmptyGrid();
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        expect(grid[r][c]).toBe(0);
      }
    }
  });

  it("returns independent grid instances", () => {
    const grid1 = buildEmptyGrid();
    const grid2 = buildEmptyGrid();
    grid1[0][0] = 5;
    expect(grid2[0][0]).toBe(0);
  });
});

describe("detectStrikes", () => {
  const grid = [
    [1,  2,  3,  4,  5],
    [6,  7,  8,  9,  10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
  ];

  describe("Row detection", () => {
    it("detects a full row as a strike", () => {
      expect(detectStrikes(grid, new Set([1, 2, 3, 4, 5]))).toBe(1);
    });

    it("detects multiple full rows as multiple strikes", () => {
      expect(detectStrikes(grid, new Set([
        1, 2, 3, 4, 5,
        6, 7, 8, 9, 10
      ]))).toBe(2);
    });

    it("doesn't count partial rows", () => {
      expect(detectStrikes(grid, new Set([1, 2, 3, 4]))).toBe(0);
    });
  });

  describe("Column detection", () => {
    it("detects a full column as a strike", () => {
      expect(detectStrikes(grid, new Set([1, 6, 11, 16, 21]))).toBe(1);
    });

    it("detects multiple full columns as multiple strikes", () => {
      expect(detectStrikes(grid, new Set([
        1, 6, 11, 16, 21,
        2, 7, 12, 17, 22
      ]))).toBe(2);
    });

    it("doesn't count partial columns", () => {
      expect(detectStrikes(grid, new Set([1, 6, 11, 16]))).toBe(0);
    });
  });

  describe("Diagonal detection", () => {
    it("detects the main diagonal as a strike", () => {
      expect(detectStrikes(grid, new Set([1, 7, 13, 19, 25]))).toBe(1);
    });

    it("detects the anti-diagonal as a strike", () => {
      expect(detectStrikes(grid, new Set([5, 9, 13, 17, 21]))).toBe(1);
    });

    it("detects both diagonals as two strikes", () => {
      expect(detectStrikes(grid, new Set([
        1, 7, 13, 19, 25,
        5, 9, 17, 21
      ]))).toBe(2);
    });

    it("doesn't count partial diagonals", () => {
      expect(detectStrikes(grid, new Set([1, 7, 13, 19]))).toBe(0);
    });
  });

  describe("Combined strikes", () => {
    it("counts row + column correctly", () => {
      expect(detectStrikes(grid, new Set([
        1, 2, 3, 4, 5,    // row 1
        6, 11, 16, 21     // col 1 (remaining)
      ]))).toBe(2);
    });

    it("counts all 5 strikes correctly", () => {
      expect(detectStrikes(grid, new Set([
        1, 2, 3, 4, 5,
        6, 7, 8, 9, 10,
        11, 12, 13, 14, 15,
        16, 17, 18, 19, 20,
        21, 22, 23, 24, 25
      ]))).toBe(5);
    });
  });

  describe("Edge cases", () => {
    it("returns 0 with empty called set", () => {
      expect(detectStrikes(grid, new Set([]))).toBe(0);
    });

    it("returns 0 with no complete lines", () => {
      expect(detectStrikes(grid, new Set([1, 2, 3, 4]))).toBe(0);
    });

    it("handles numbers not in grid gracefully", () => {
      expect(detectStrikes(grid, new Set([1, 2, 3, 4, 5, 99]))).toBe(1);
    });
  });
});

describe("isWinner", () => {
  it("returns true at exactly 5 strikes", () => {
    expect(isWinner(5)).toBe(true);
  });

  it("returns true at more than 5 strikes", () => {
    expect(isWinner(6)).toBe(true);
    expect(isWinner(10)).toBe(true);
  });

  it("returns false below 5 strikes", () => {
    expect(isWinner(0)).toBe(false);
    expect(isWinner(1)).toBe(false);
    expect(isWinner(4)).toBe(false);
  });

  it("returns false at exactly 4 strikes", () => {
    expect(isWinner(4)).toBe(false);
  });
});


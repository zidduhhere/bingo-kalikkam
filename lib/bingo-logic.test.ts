import { buildEmptyGrid, detectStrikes, isWinner } from "./bingo-logic";

describe("buildEmptyGrid", () => {
  it("returns a 5x5 grid of zeros", () => {
    const grid = buildEmptyGrid();
    expect(grid.length).toBe(5);
    expect(grid[0].length).toBe(5);
    expect(grid[0][0]).toBe(0);
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
  it("detects a full row as a strike", () => {
    expect(detectStrikes(grid, new Set([1, 2, 3, 4, 5]))).toBe(1);
  });
  it("detects a full column as a strike", () => {
    expect(detectStrikes(grid, new Set([1, 6, 11, 16, 21]))).toBe(1);
  });
  it("detects the main diagonal as a strike", () => {
    expect(detectStrikes(grid, new Set([1, 7, 13, 19, 25]))).toBe(1);
  });
  it("detects the anti-diagonal as a strike", () => {
    expect(detectStrikes(grid, new Set([5, 9, 13, 17, 21]))).toBe(1);
  });
  it("returns 0 when no line is complete", () => {
    expect(detectStrikes(grid, new Set([1, 2, 3, 4]))).toBe(0);
  });
});

describe("isWinner", () => {
  it("returns true at 5 strikes", () => expect(isWinner(5)).toBe(true));
  it("returns false below 5 strikes", () => expect(isWinner(4)).toBe(false));
});

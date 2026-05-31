export function buildEmptyGrid(): number[][] {
  return Array.from({ length: 5 }, () => Array(5).fill(0));
}

export function detectStrikes(grid: number[][], called: Set<number>): number {
  const SIZE = 5;
  let strikes = 0;
  for (let r = 0; r < SIZE; r++) {
    if (grid[r].every((n) => called.has(n))) strikes++;
  }
  for (let c = 0; c < SIZE; c++) {
    if (grid.every((row) => called.has(row[c]))) strikes++;
  }
  if (Array.from({ length: SIZE }, (_, i) => grid[i][i]).every((n) => called.has(n))) strikes++;
  if (Array.from({ length: SIZE }, (_, i) => grid[i][SIZE - 1 - i]).every((n) => called.has(n))) strikes++;
  return strikes;
}

export function isWinner(strikeCount: number): boolean {
  return strikeCount >= 5;
}

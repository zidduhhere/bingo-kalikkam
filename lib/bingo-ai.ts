export type Difficulty = "normal" | "hard";

/**
 * Helper to calculate how many numbers in a line have been called.
 */
function getLineCalledCount(line: number[], called: Set<number>): number {
  let count = 0;
  for (const n of line) {
    if (called.has(n)) count++;
  }
  return count;
}

/**
 * Scores a specific number based on the state of the lines it belongs to.
 * Higher score means the number is more beneficial.
 */
function scoreNumber(
  grid: number[][],
  num: number,
  called: Set<number>
): number {
  const SIZE = 5;
  let r = -1;
  let c = -1;

  // Find position
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
      if (grid[i][j] === num) {
        r = i;
        c = j;
        break;
      }
    }
    if (r !== -1) break;
  }

  if (r === -1 || c === -1) return 0; // Should not happen in a valid 1-25 grid

  // Extract lines
  const row = grid[r];
  const col = grid.map((row) => row[c]);
  const lines: number[][] = [row, col];

  if (r === c) {
    const diag1 = Array.from({ length: SIZE }, (_, i) => grid[i][i]);
    lines.push(diag1);
  }
  if (r + c === SIZE - 1) {
    const diag2 = Array.from({ length: SIZE }, (_, i) => grid[i][SIZE - 1 - i]);
    lines.push(diag2);
  }

  let totalScore = 0;
  
  // Weights based on how close the line is to completion
  // 4 called -> 1000 (calling this completes the line!)
  // 3 called -> 50
  // 2 called -> 10
  // 1 called -> 2
  // 0 called -> 1
  const weights = [1, 2, 10, 50, 1000];

  for (const line of lines) {
    const count = getLineCalledCount(line, called);
    if (count < 5) {
      totalScore += weights[count];
    }
  }

  return totalScore;
}

export function getBestComputerMove(
  computerGrid: number[][],
  opponentGrid: number[][] | undefined,
  calledNumbers: number[],
  difficulty: Difficulty
): number {
  const calledSet = new Set(calledNumbers);
  
  // Find all uncalled numbers
  const uncalled = Array.from({ length: 25 }, (_, i) => i + 1).filter(
    (n) => !calledSet.has(n)
  );

  if (uncalled.length === 0) return -1; // No moves left

  let bestNum = uncalled[0];
  let bestScore = -Infinity;

  for (const num of uncalled) {
    const offensiveScore = scoreNumber(computerGrid, num, calledSet);
    
    let defensiveScore = 0;
    // In Hard mode, we look at the opponent's grid and penalize numbers
    // that would help the opponent. (We subtract their potential gain).
    if (difficulty === "hard" && opponentGrid) {
      defensiveScore = scoreNumber(opponentGrid, num, calledSet);
    }

    // Small random factor to prevent deterministic identical games
    const noise = Math.random() * 0.5;
    
    const netScore = offensiveScore - defensiveScore + noise;

    if (netScore > bestScore) {
      bestScore = netScore;
      bestNum = num;
    }
  }

  return bestNum;
}

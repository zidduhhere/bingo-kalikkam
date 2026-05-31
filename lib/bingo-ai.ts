export type Difficulty = "normal" | "hard";

// ─── Board helpers ────────────────────────────────────────────────────────────

/** All lines on an N×N bingo board (N rows + N cols + 2 diagonals) */
function getAllLines(grid: number[][]): number[][] {
  const SIZE = grid.length;
  const lines: number[][] = [];
  for (let r = 0; r < SIZE; r++) lines.push(grid[r].slice());
  for (let c = 0; c < SIZE; c++) lines.push(grid.map((row) => row[c]));
  lines.push(Array.from({ length: SIZE }, (_, i) => grid[i][i]));
  lines.push(Array.from({ length: SIZE }, (_, i) => grid[i][SIZE - 1 - i]));
  return lines;
}

/** How many numbers in a line have already been called */
function calledCount(line: number[], called: Set<number>): number {
  return line.filter((n) => called.has(n)).length;
}

/** How many complete lines (strikes) a grid currently has */
function countStrikes(grid: number[][], called: Set<number>): number {
  return getAllLines(grid).filter((line) => line.every((n) => called.has(n))).length;
}

/** Numbers in a line that have NOT been called yet */
function uncalledInLine(line: number[], called: Set<number>): number[] {
  return line.filter((n) => !called.has(n));
}

// ─── Minimum-path-to-N-strikes analyser ──────────────────────────────────────
// Computes which combination of lines gives the computer `targetStrikes` using
// the fewest additional numbers. Uses a greedy set-cover approximation:
//   1. Filter out already-complete lines.
//   2. Sort incomplete lines by fewest uncalled numbers (closest to done first).
//   3. Greedily select lines until we have enough to hit targetStrikes.
//   4. Return the union of uncalled numbers on those chosen lines.
//
// The AI uses this to assign a large bonus to numbers on the optimal path,
// so it consistently marches toward the shortest winning sequence.
function minPathNumbers(
  grid: number[][],
  called: Set<number>,
  targetStrikes: number
): Set<number> {
  const allLines = getAllLines(grid);
  const currentStrikes = allLines.filter((l) => l.every((n) => called.has(n))).length;
  const strikesNeeded = Math.max(0, targetStrikes - currentStrikes);
  if (strikesNeeded === 0) return new Set();

  // Only consider incomplete lines
  const incomplete = allLines.filter((l) => !l.every((n) => called.has(n)));

  // Sort: fewest uncalled numbers first (easiest to complete)
  const sorted = [...incomplete].sort((a, b) => {
    const ua = a.filter((n) => !called.has(n)).length;
    const ub = b.filter((n) => !called.has(n)).length;
    return ua - ub;
  });

  const targeted = new Set<number>();
  for (let i = 0; i < strikesNeeded && i < sorted.length; i++) {
    for (const n of sorted[i]) {
      if (!called.has(n)) targeted.add(n);
    }
  }
  return targeted;
}

// ─── Line-completion urgency weight ──────────────────────────────────────────
// Returns a score representing how "hot" a line is (how close to completion).
// Used for BOTH offense (on computer's grid) and defense (on opponent's grid).
//
// Scale designed so that:
//   N-1-of-N filled → completing it wins the line IMMEDIATELY (top priority)
//   N-2-of-N        → very urgent
//   2-of-N          → worth targeting
//   1-of-N          → mild interest
//   0-of-N          → negligible
const URGENCY_WEIGHTS = [0, 2, 12, 80, 5000] as const;

function lineUrgency(line: number[], called: Set<number>): number {
  const filled = calledCount(line, called);
  if (filled >= line.length) return 0; // already done, no value
  // Clamp index for variable-size grids
  const idx = Math.min(filled, URGENCY_WEIGHTS.length - 1);
  return URGENCY_WEIGHTS[idx];
}

// ─── Per-number offensive score on a grid ────────────────────────────────────
// Sum of urgency of every incomplete line this number belongs to.
function offensiveScore(
  grid: number[][],
  num: number,
  called: Set<number>
): number {
  let score = 0;
  for (const line of getAllLines(grid)) {
    if (line.includes(num) && !called.has(num)) {
      score += lineUrgency(line, called);
    }
  }
  return score;
}

// ─── 2-ply look-ahead ────────────────────────────────────────────────────────
// After the computer picks `num`, simulate the opponent making their single
// best offensive reply, and return the net strike delta (computer - opponent).
function lookahead(
  computerGrid: number[][],
  opponentGrid: number[][] | undefined,
  calledSet: Set<number>,
  num: number
): number {
  if (!opponentGrid) return 0;

  // Simulate computer's move
  const afterComputer = new Set(calledSet);
  afterComputer.add(num);

  const compStrikesBefore = countStrikes(computerGrid, calledSet);
  const compStrikesAfter = countStrikes(computerGrid, afterComputer);
  const compGain = compStrikesAfter - compStrikesBefore;

  // Find opponent's best reply (greedy, 1-ply)
  const SIZE = computerGrid.length;
  const total = SIZE * SIZE;
  const uncalledAfter = Array.from({ length: total }, (_, i) => i + 1).filter(
    (n) => !afterComputer.has(n)
  );
  if (uncalledAfter.length === 0) return compGain;

  let bestOppScore = -Infinity;
  for (const oppNum of uncalledAfter) {
    const s = offensiveScore(opponentGrid, oppNum, afterComputer);
    if (s > bestOppScore) bestOppScore = s;
  }

  // Penalise if opponent can score highly on their next turn
  return compGain * 200 - bestOppScore * 0.4;
}

// ─── Defensive pressure score ────────────────────────────────────────────────
// Measures how much a number helps the opponent. The AI will SUBTRACT this 
// from the total score to AVOID calling numbers that the opponent needs.
function defensiveScore(
  opponentGrid: number[][] | undefined,
  num: number,
  called: Set<number>
): number {
  if (!opponentGrid) return 0;
  let score = 0;
  for (const line of getAllLines(opponentGrid)) {
    if (line.includes(num) && !called.has(num)) {
      // Weight defense heavier the closer opponent is to completion
      const filled = calledCount(line, called);
      const idx = Math.min(filled, URGENCY_WEIGHTS.length - 1);
      // At N-1 filled, opponent is about to win that line — avoid giving it to them!
      score += URGENCY_WEIGHTS[idx] * (filled >= line.length - 2 ? 2.5 : 1.0);
    }
  }
  return score;
}

// ─── Strategic grid generator ─────────────────────────────────────────────────
// Generates a shuffled N×N grid (numbers 1 to N²) using Fisher-Yates.
export function generateStrategicGrid(size = 5): number[][] {
  const total = size * size;
  const nums = Array.from({ length: total }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return Array.from({ length: size }, (_, r) => nums.slice(r * size, r * size + size));
}

// ─── Main exported function ───────────────────────────────────────────────────
/**
 * Returns the best number for the computer to call next.
 *
 * Strategy layers (evaluated in priority order for HARD mode):
 *   1. Immediate win  — if calling X gives the computer a new strike, do it.
 *   2. Full scored evaluation:
 *        score = offensiveScore * offWeight
 *              + minPathBonus   (numbers on the minimum-path-to-5-strikes lines)
 *              - defensiveScore * defWeight   (hard only, subtract to avoid helping!)
 *              + lookahead bonus              (hard only)
 *              + noise                        (small for hard, larger for normal)
 */
export function getBestComputerMove(
  computerGrid: number[][],
  opponentGrid: number[][] | undefined,
  calledNumbers: number[],
  difficulty: Difficulty
): number {
  const calledSet = new Set(calledNumbers);
  const SIZE = computerGrid.length;
  const totalNumbers = SIZE * SIZE;
  const WIN_STRIKES = SIZE; // 5 strikes on a 5×5, 4 on 4×4, etc.

  const uncalled = Array.from({ length: totalNumbers }, (_, i) => i + 1).filter(
    (n) => !calledSet.has(n)
  );
  if (uncalled.length === 0) return -1;

  const isHard = difficulty === "hard";

  // ── Layer 1: Immediate win ────────────────────────────────────────────────
  // Any number that immediately completes a line on the computer's grid.
  for (const num of uncalled) {
    const simSet = new Set(calledSet);
    simSet.add(num);
    if (countStrikes(computerGrid, simSet) > countStrikes(computerGrid, calledSet)) {
      return num; // Always take the win
    }
  }

  // ── Layer 2: Full scored evaluation ──────────────────────────────────────
  // Pre-compute which numbers lie on the minimum-path-to-victory lines.
  // Numbers on those lines get a strong bonus so the AI marches toward the
  // shortest winning sequence rather than reacting greedily turn-by-turn.
  const optimalTargets = minPathNumbers(computerGrid, calledSet, WIN_STRIKES);

  const offWeight = 1.0;
  const defWeight = isHard ? 1.8 : 0;
  // Hard mode follows the optimal path tightly; normal mode is more exploratory
  const minPathBonus = isHard ? 300 : 80;
  // Noise: hard is near-deterministic; normal has meaningful variety
  const noiseScale = isHard ? 0.1 : 15;

  let bestNum = uncalled[0];
  let bestScore = -Infinity;

  for (const num of uncalled) {
    const off = offensiveScore(computerGrid, num, calledSet);
    const def = defensiveScore(opponentGrid, num, calledSet);
    const ahead = isHard ? lookahead(computerGrid, opponentGrid, calledSet, num) : 0;
    const pathBonus = optimalTargets.has(num) ? minPathBonus : 0;
    const noise = Math.random() * noiseScale;

    // Subtract defensive score so we don't give the opponent what they want
    const total = off * offWeight - def * defWeight + ahead + pathBonus + noise;

    if (total > bestScore) {
      bestScore = total;
      bestNum = num;
    }
  }

  return bestNum;
}

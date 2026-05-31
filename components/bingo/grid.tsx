import { Cell } from "./cell";
interface GridProps { grid: number[][]; calledNumbers: Set<number>; isEditing?: boolean; onCellClick?: (row: number, col: number) => void; }
export function Grid({ grid, calledNumbers, isEditing = false, onCellClick }: GridProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {grid.map((row, r) =>
        row.map((value, c) => (
          <Cell key={`${r}-${c}`} value={value} isCalled={calledNumbers.has(value)} isEditing={isEditing} onClick={() => onCellClick?.(r, c)} />
        ))
      )}
    </div>
  );
}

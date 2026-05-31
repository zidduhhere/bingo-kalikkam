import React from "react";
import { Cell } from "./cell";

interface GridProps { 
  grid: number[][]; 
  calledNumbers: Set<number>; 
  lastCalledNumber?: number | null;
  isEditing?: boolean; 
  onCellClick?: (row: number, col: number) => void; 
  onCellChange?: (row: number, col: number, val: string) => void;
  onCellKeyDown?: (row: number, col: number, e: React.KeyboardEvent<HTMLElement>) => void;
  cellRefs?: React.MutableRefObject<(HTMLInputElement | null)[][]>;
  buttonRefs?: React.MutableRefObject<(HTMLButtonElement | null)[][]>;
}

export function Grid({ grid, calledNumbers, lastCalledNumber, isEditing = false, onCellClick, onCellChange, onCellKeyDown, cellRefs, buttonRefs }: GridProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {grid.map((row, r) =>
        row.map((value, c) => (
          <Cell 
            key={`${r}-${c}`} 
            value={value} 
            isCalled={calledNumbers.has(value)} 
            isLastCalled={lastCalledNumber != null && value === lastCalledNumber}
            isEditing={isEditing} 
            onClick={() => onCellClick?.(r, c)} 
            onChange={(e) => onCellChange?.(r, c, e.target.value)}
            onKeyDown={(e) => onCellKeyDown?.(r, c, e)}
            inputRef={(el) => { if (cellRefs) cellRefs.current[r][c] = el; }}
            buttonRef={(el) => { if (buttonRefs) buttonRefs.current[r][c] = el; }}
          />
        ))
      )}
    </div>
  );
}

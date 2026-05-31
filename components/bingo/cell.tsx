import { cn } from "@/lib/utils";
import React from "react";
interface CellProps { 
  value: number; 
  isCalled: boolean; 
  isLastCalled?: boolean;
  isEditing?: boolean; 
  onClick?: () => void; 
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void; 
  inputRef?: React.Ref<HTMLInputElement>;
  buttonRef?: React.Ref<HTMLButtonElement>;
}

export function Cell({ value, isCalled, isLastCalled, isEditing, onClick, onChange, onKeyDown, inputRef, buttonRef }: CellProps) {
  // Irregular hand-drawn border radiuses to simulate pen boxes, now thicker and more opaque
  const drawnBorder = "border-[3px] border-blue-900 shadow-[2px_2px_0_0_rgba(30,58,138,0.2)] rounded-[255px_15px_225px_15px/15px_225px_15px_255px]";

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={value === 0 ? "" : value.toString()}
        onChange={onChange ?? (() => {})}
        readOnly={!onChange}
        onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLInputElement>}
        onClick={onClick}
        className={cn(
          "flex h-14 w-14 items-center justify-center text-3xl font-bold text-center transition-all bg-transparent",
          drawnBorder,
          "text-blue-900 focus:border-red-600 focus:outline-none focus:shadow-[4px_4px_0_0_rgba(220,38,38,0.3)] focus:bg-white/80 focus:rounded-[15px_255px_15px_225px/255px_15px_225px_15px]",
          value === 0 && "border-dashed border-blue-900/40 placeholder:text-blue-900/30"
        )}
        placeholder="?"
      />
    );
  }

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLButtonElement>}
      className={cn(
        "relative flex h-14 w-14 items-center justify-center text-3xl font-bold transition-all select-none focus:outline-none bg-transparent cursor-pointer overflow-visible",
        drawnBorder,
        isCalled ? "text-red-700 bg-red-50/50" : "text-blue-900 hover:bg-blue-50/80 active:bg-blue-100",
        isLastCalled && "border-amber-500 shadow-[0_0_14px_4px_rgba(251,191,36,0.6)] bg-amber-50/70 scale-110 z-10",
        "focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-transparent"
      )}
    >
      {/* Pulsing outer ring for last called */}
      {isLastCalled && (
        <span className="absolute -inset-1 rounded-[255px_15px_225px_15px/15px_225px_15px_255px] border-2 border-amber-400 animate-ping opacity-60 pointer-events-none" />
      )}
      <span className="z-10 mix-blend-multiply">{value === 0 ? "?" : value}</span>
      {isCalled && (
        <svg className="absolute inset-0 w-full h-full text-red-600 pointer-events-none opacity-90" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Multiple paths to simulate a thick, scribbled marker cross */}
          <path d="M 15,15 Q 50,45 85,85 M 85,15 Q 50,55 15,85" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" className="drop-shadow-sm opacity-80" />
          <path d="M 17,13 Q 50,45 83,87 M 87,13 Q 50,55 13,87" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" className="drop-shadow-sm opacity-60" />
        </svg>
      )}
    </button>
  );
}

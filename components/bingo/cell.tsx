import { cn } from "@/lib/utils";
import React from "react";
interface CellProps { 
  value: number; 
  isCalled: boolean; 
  isEditing?: boolean; 
  onClick?: () => void; 
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void; 
  inputRef?: React.Ref<HTMLInputElement>;
  buttonRef?: React.Ref<HTMLButtonElement>;
}

export function Cell({ value, isCalled, isEditing, onClick, onChange, onKeyDown, inputRef, buttonRef }: CellProps) {
  // Irregular hand-drawn border radiuses to simulate pen boxes
  const drawnBorder = "border-[3px] border-blue-900/80 [border-radius:255px_15px_225px_15px/15px_225px_15px_255px]";

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={value === 0 ? "" : value}
        onChange={onChange}
        onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLInputElement>}
        onClick={onClick}
        className={cn(
          "flex h-14 w-14 items-center justify-center text-3xl font-bold text-center transition-all bg-transparent",
          drawnBorder,
          "text-blue-900 focus:border-red-500 focus:outline-none focus:[border-radius:15px_255px_15px_225px/255px_15px_225px_15px]",
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
        "relative flex h-14 w-14 items-center justify-center text-3xl font-bold transition-all select-none focus:outline-none bg-transparent cursor-pointer overflow-hidden",
        drawnBorder,
        isCalled ? "text-red-700 opacity-90" : "text-blue-900 hover:bg-blue-900/5",
        "focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#fdfaf3]"
      )}
    >
      <span className="z-10 mix-blend-multiply">{value === 0 ? "?" : value}</span>
      {isCalled && (
        <svg className="absolute inset-0 w-full h-full text-red-500/70 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 20,20 Q 50,45 80,80 M 80,20 Q 50,55 20,80" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" className="drop-shadow-sm" />
        </svg>
      )}
    </button>
  );
}

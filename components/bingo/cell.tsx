import { cn } from "@/lib/utils";
interface CellProps { value: number; isCalled: boolean; isEditing?: boolean; onClick?: () => void; }
export function Cell({ value, isCalled, isEditing, onClick }: CellProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isEditing && !isCalled}
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-lg border-2 text-lg font-bold transition-all select-none",
        isCalled ? "border-indigo-500 bg-indigo-600 text-white shadow-md" : "border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
        isEditing && !isCalled && "cursor-grab hover:border-indigo-300 hover:bg-indigo-50",
        value === 0 && "border-dashed border-zinc-300 text-zinc-300"
      )}
    >
      {value === 0 ? "?" : value}
    </button>
  );
}

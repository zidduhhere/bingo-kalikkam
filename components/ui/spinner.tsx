import { cn } from "@/lib/utils";
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn("h-6 w-6 animate-[spin_1.5s_linear_infinite] rounded-full border-[3px] border-dashed border-blue-900/30 border-t-blue-900/80 rounded-[255px_225px_255px_200px/225px_255px_200px_255px]", className)} />
  );
}

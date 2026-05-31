import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border-2 border-blue-900/30 bg-transparent px-3 py-2 text-xl text-blue-900 placeholder-blue-900/40 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 [border-radius:15px_255px_15px_225px/255px_15px_225px_15px]",
        className
      )}
      {...props}
    />
  );
}

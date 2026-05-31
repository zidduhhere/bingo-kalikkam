import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border-2 border-blue-900 bg-white/60 px-3 py-2 text-xl text-blue-900 placeholder-blue-900/40 shadow-[2px_2px_0_0_rgba(30,58,138,0.3)] focus:shadow-[4px_4px_0_0_rgba(220,38,38,0.5)] focus:border-red-500 focus:outline-none transition-all rounded-[15px_255px_15px_225px/255px_15px_225px_15px]",
        className
      )}
      {...props}
    />
  );
}

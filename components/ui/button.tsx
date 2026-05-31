import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "outline" | "secondary";
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:opacity-50 select-none",
        "active:scale-95 active:translate-y-[2px]", // Press down effect
        variant === "primary" &&
          "bg-white text-blue-900 hover:bg-blue-50 border-2 border-blue-900 shadow-[4px_4px_0_0_rgba(30,58,138,1)] hover:shadow-[2px_2px_0_0_rgba(30,58,138,1)] rounded-[255px_15px_225px_15px/15px_225px_15px_255px]",
        variant === "ghost" &&
          "border-2 border-transparent bg-transparent text-blue-900 hover:bg-blue-900/5 rounded-[15px_255px_15px_225px/255px_15px_225px_15px]",
        variant === "outline" &&
          "border-2 border-blue-900/60 bg-white/50 text-blue-900 hover:bg-blue-900/5 shadow-[2px_2px_0_0_rgba(30,58,138,0.5)] rounded-[225px_15px_255px_15px/15px_255px_15px_225px]",
        variant === "secondary" &&
          "bg-blue-100 text-blue-900 hover:bg-blue-200 border-2 border-blue-900 shadow-[3px_3px_0_0_rgba(30,58,138,0.8)] rounded-[15px_225px_15px_255px/255px_15px_225px_15px]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

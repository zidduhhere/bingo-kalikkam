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
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50",
        variant === "primary" &&
          "bg-blue-600 text-white hover:bg-blue-700 shadow-sm border border-blue-700/50 [border-radius:255px_15px_225px_15px/15px_225px_15px_255px]",
        variant === "ghost" &&
          "border-2 border-transparent bg-transparent text-blue-900 hover:bg-blue-900/5 [border-radius:15px_255px_15px_225px/255px_15px_225px_15px]",
        variant === "outline" &&
          "border-2 border-blue-900/40 bg-transparent text-blue-900 hover:bg-blue-900/5 [border-radius:225px_15px_255px_15px/15px_255px_15px_225px]",
        variant === "secondary" &&
          "bg-blue-100 text-blue-900 hover:bg-blue-200 border border-blue-200 [border-radius:15px_225px_15px_255px/255px_15px_225px_15px]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

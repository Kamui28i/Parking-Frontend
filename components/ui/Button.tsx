"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "destructive" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[#1D1D1F] text-white hover:bg-[#333333] disabled:opacity-50",
  secondary:
    "bg-white text-[#1D1D1F] border border-[#E5E5EA] hover:bg-[#F5F5F7] disabled:opacity-50",
  destructive:
    "bg-[#FF3B30] text-white hover:bg-[#d63028] disabled:opacity-50",
  ghost:
    "bg-transparent text-[#1D1D1F] hover:bg-[#F5F5F7] disabled:opacity-50",
};

export default function Button({
  variant = "primary",
  fullWidth,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        h-11 px-6 rounded-xl text-sm font-medium
        transition-colors cursor-pointer
        ${variantStyles[variant]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

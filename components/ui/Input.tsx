import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-[#1D1D1F]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          h-11 px-3 rounded-xl border border-[#D2D2D7] bg-white
          text-sm text-[#1D1D1F] placeholder-[#AEAEB2]
          focus:outline-none focus:border-[#1D1D1F]
          transition-colors
          ${className}
        `}
        {...props}
      />
    </div>
  );
}

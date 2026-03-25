"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      {label && <span className="text-sm text-[#1D1D1F]">{label}</span>}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`
          relative w-11 h-6 rounded-full transition-colors
          ${checked ? "bg-[#1D1D1F]" : "bg-[#D2D2D7]"}
        `}
      >
        <span
          className={`
            absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform
            ${checked ? "translate-x-5" : "translate-x-0.5"}
          `}
        />
      </button>
    </label>
  );
}

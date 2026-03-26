"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

export default function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      {label && <span className="text-sm text-[#1D1D1F]">{label}</span>}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? "bg-[#34C759]" : "bg-[#D2D2D7]"
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${
            checked ? "left-[26px]" : "left-1"
          }`}
        />
      </button>
    </label>
  );
}

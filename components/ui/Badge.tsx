type BadgeVariant = "green" | "amber" | "red" | "blue" | "gray";

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  green: { bg: "bg-[#F0FAF3]", text: "text-[#22C55E]", dot: "bg-[#22C55E]" },
  amber: { bg: "bg-[#FFFBEB]", text: "text-[#F59E0B]", dot: "bg-[#F59E0B]" },
  red: { bg: "bg-[#FFF0EF]", text: "text-[#EF4444]", dot: "bg-[#EF4444]" },
  blue: { bg: "bg-[#EFF6FF]", text: "text-[#3B82F6]", dot: "bg-[#3B82F6]" },
  gray: { bg: "bg-[#F5F5F7]", text: "text-[#AEAEB2]", dot: "bg-[#AEAEB2]" },
};

export function statusToBadge(
  status: string
): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    FREE: "green",
    CONFIRMED: "green",
    PAID: "green",
    RESERVED: "amber",
    PENDING: "amber",
    OCCUPIED: "red",
    FAILED: "red",
    CANCELLED: "gray",
    ACTIVE: "blue",
    COMPLETED: "green",
  };
  return map[status.toUpperCase()] ?? "gray";
}

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export default function Badge({ label, variant = "gray" }: BadgeProps) {
  const s = variantStyles[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

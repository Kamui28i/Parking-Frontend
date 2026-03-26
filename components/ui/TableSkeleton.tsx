function SkeletonCell({ wide }: { wide?: boolean }) {
  return (
    <td className="px-4 py-3">
      <div className={`h-4 rounded-md bg-[#E5E5EA] animate-pulse ${wide ? "w-32" : "w-20"}`} />
    </td>
  );
}

export default function TableSkeleton({ rows = 4, cols }: { rows?: number; cols: number }) {
  return (
    <tbody className="divide-y divide-[#F5F5F7]">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          <td className="px-4 py-3">
            <div className="h-4 w-28 rounded-md bg-[#E5E5EA] animate-pulse mb-1" />
            <div className="h-3 w-20 rounded-md bg-[#F5F5F7] animate-pulse" />
          </td>
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <SkeletonCell key={j} wide={j === 0} />
          ))}
        </tr>
      ))}
    </tbody>
  );
}

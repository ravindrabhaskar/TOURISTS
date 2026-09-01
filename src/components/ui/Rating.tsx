import { Star } from "lucide-react";

export default function Rating({
  rating,
  count,
  className = "",
}: {
  rating: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Star size={14} className="fill-gold text-gold" aria-hidden />
      <span className="font-mono text-sm font-medium">{rating.toFixed(1)}</span>
      {typeof count === "number" && (
        <span className="text-xs text-muted">({count})</span>
      )}
    </span>
  );
}

import { MONTHS, SEASON_LABEL } from "@/lib/season";

const CELL: Record<number, string> = {
  0: "bg-surface2",
  1: "bg-gold/45",
  2: "bg-pine",
};

export default function SeasonBar({
  season,
  activeMonth,
  showLabels = false,
  size = "sm",
}: {
  season: number[];
  activeMonth?: number;
  showLabels?: boolean;
  size?: "sm" | "lg";
}) {
  return (
    <div
      className="flex w-full items-end gap-[3px]"
      role="img"
      aria-label={`Season by month: ${season
        .map((v, i) => `${MONTHS[i]} ${SEASON_LABEL[v]}`)
        .join(", ")}`}
    >
      {season.map((v, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div
            title={`${MONTHS[i]} · ${SEASON_LABEL[v]}`}
            className={`${size === "lg" ? "h-6 rounded-md" : "h-2 rounded-full"} ${
              CELL[v]
            } ${activeMonth === i ? "ring-2 ring-accent ring-offset-1 ring-offset-surface" : ""} ${
              v === 0 && activeMonth === i ? "ring-danger" : ""
            } w-full`}
          />
          {showLabels && (
            <span
              className={`font-mono text-[10px] leading-none ${
                activeMonth === i ? "text-accent font-bold" : "text-muted"
              }`}
            >
              {MONTHS[i]?.[0]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

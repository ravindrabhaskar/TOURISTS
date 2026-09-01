import { cn } from "@/lib/cn";

export default function SectionHead({
  eyebrow,
  title,
  sub,
  align = "left",
  className = "",
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
        {title}
      </h2>
      {sub && <p className="mt-3 text-base leading-relaxed text-muted">{sub}</p>}
    </div>
  );
}

/** Monogram avatar — professional initials block, no emoji. */

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-16 w-16 text-xl",
} as const;

export function Avatar({
  name,
  size = "md",
  tone = "ink",
}: {
  name: string;
  size?: keyof typeof SIZES;
  tone?: "ink" | "accent";
}) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-semibold tracking-wide ${
        tone === "accent" ? "bg-accent-600 text-white" : "bg-zinc-900 text-white"
      } ${SIZES[size]}`}
    >
      {initialsOf(name)}
    </span>
  );
}

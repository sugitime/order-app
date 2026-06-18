import { cn } from "@/lib/utils";

type PrimeBadgeProps = {
  isPrimeEligible: boolean | null | undefined;
  className?: string;
};

export function PrimeBadge({ isPrimeEligible, className }: PrimeBadgeProps) {
  if (isPrimeEligible === null || isPrimeEligible === undefined) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-muted",
          className
        )}
      >
        Prime unknown
      </span>
    );
  }

  if (isPrimeEligible) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-sky-950/60 px-2 py-0.5 text-xs font-semibold text-sky-300",
          className
        )}
      >
        Prime
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-muted",
        className
      )}
    >
      Not Prime
    </span>
  );
}
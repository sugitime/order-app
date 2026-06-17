import { cn } from "@/lib/utils";
import type { LineItemStatus } from "@prisma/client";

const styles: Record<LineItemStatus, string> = {
  PENDING: "bg-amber-900/40 text-amber-300 ring-1 ring-amber-700/50",
  APPROVED: "bg-green-900/40 text-green-300 ring-1 ring-green-700/50",
  DENIED: "bg-red-900/40 text-red-300 ring-1 ring-red-700/50",
  QUEUED: "bg-blue-900/40 text-blue-300 ring-1 ring-blue-700/50",
  ORDERING: "bg-indigo-900/40 text-indigo-300 ring-1 ring-indigo-700/50",
  ORDERED: "bg-emerald-900/40 text-emerald-300 ring-1 ring-emerald-700/50",
  FAILED: "bg-rose-900/40 text-rose-300 ring-1 ring-rose-700/50",
};

export function StatusBadge({ status }: { status: LineItemStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        styles[status]
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
import { cn } from "@/lib/utils";
import type { LineItemStatus } from "@prisma/client";

const styles: Record<LineItemStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  DENIED: "bg-red-100 text-red-800",
  QUEUED: "bg-blue-100 text-blue-800",
  ORDERING: "bg-indigo-100 text-indigo-800",
  ORDERED: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-rose-100 text-rose-800",
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
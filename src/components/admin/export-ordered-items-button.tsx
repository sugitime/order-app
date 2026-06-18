import { cn } from "@/lib/utils";

export function ExportOrderedItemsButton() {
  return (
    <a
      href="/api/admin/orders/export"
      className={cn(
        "inline-flex items-center justify-center rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-medium text-text transition hover:bg-surface-raised"
      )}
    >
      Export ordered items
    </a>
  );
}
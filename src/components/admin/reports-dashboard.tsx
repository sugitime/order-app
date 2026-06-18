import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/amazon-product";
import type { OrderReportStats } from "@/lib/order-reports";

function StatCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string | number;
  detail?: string;
  accent?: "amber" | "emerald" | "red" | "brand";
}) {
  const accentClasses = {
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    red: "text-red-400",
    brand: "text-brand-400",
  };

  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p
        className={`mt-2 text-3xl font-semibold tabular-nums ${
          accent ? accentClasses[accent] : "text-text"
        }`}
      >
        {value}
      </p>
      {detail && <p className="mt-2 text-sm text-text-muted">{detail}</p>}
    </Card>
  );
}

export function ReportsDashboard({ stats }: { stats: OrderReportStats }) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">Orders</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Pending orders"
            value={stats.pendingOrders}
            detail="Orders with at least one item awaiting review"
            accent="amber"
          />
          <StatCard
            label="Approved orders"
            value={stats.approvedOrders}
            detail="Orders where every item is approved and ready to queue"
            accent="emerald"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">Line items</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Pending items"
            value={stats.itemsPending}
            detail="Awaiting approver decision"
            accent="amber"
          />
          <StatCard
            label="Approved items"
            value={stats.itemsApproved}
            detail="Approved, queued, or ordered"
            accent="emerald"
          />
          <StatCard
            label="Denied items"
            value={stats.itemsDenied}
            detail="Not approved for purchase"
            accent="red"
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">Spend</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Total order cost"
            value={formatCurrency(stats.totalOrderCost, "USD")}
            detail="Sum of approved, queued, and ordered items (excludes pending and denied)"
            accent="brand"
          />
          <StatCard
            label="Total denied amount"
            value={formatCurrency(stats.totalDeniedAmount, "USD")}
            detail="Sum of denied line items based on listed unit prices"
            accent="red"
          />
        </div>
      </section>
    </div>
  );
}
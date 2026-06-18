export const dynamic = "force-dynamic";

import { ReportsDashboard } from "@/components/admin/reports-dashboard";
import { getOrderReportStats } from "@/lib/order-reports";

export default async function ReportsPage() {
  const stats = await getOrderReportStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Reports</h1>
        <p className="mt-1 text-sm text-text-muted">
          Overview of order volume, item status, and spend across active orders.
        </p>
      </div>
      <ReportsDashboard stats={stats} />
    </div>
  );
}
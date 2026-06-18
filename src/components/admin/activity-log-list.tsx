"use client";

import type { OrderActivityAction } from "@prisma/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  formatActivityActionLabel,
  formatActivityDetails,
  resolveLogPerformer,
} from "@/lib/order-activity-log-format";
import { formatDate } from "@/lib/utils";

export type ActivityLogEntry = {
  id: string;
  orderId: string;
  action: OrderActivityAction;
  details: string | null;
  createdAt: string;
  performedByName: string | null;
  performedByEmail: string | null;
  requesterName: string;
  orderDeleted: boolean;
};

export function ActivityLogList({
  logs,
  initialOrderId,
}: {
  logs: ActivityLogEntry[];
  initialOrderId: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(initialOrderId);

  function applyFilter(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = orderId.trim();
    if (trimmed) {
      params.set("orderId", trimmed);
    } else {
      params.delete("orderId");
    }
    const query = params.toString();
    router.push(query ? `/admin/log?${query}` : "/admin/log");
  }

  function clearFilter() {
    setOrderId("");
    router.push("/admin/log");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={applyFilter} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[280px] flex-1">
          <label htmlFor="log-order-search">Search by order reference ID</label>
          <input
            id="log-order-search"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Paste order reference ID..."
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
        {initialOrderId && (
          <button
            type="button"
            onClick={clearFilter}
            className="rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-text hover:bg-surface-raised"
          >
            Clear
          </button>
        )}
      </form>

      {initialOrderId && (
        <p className="text-sm text-text-muted">
          Showing activity for order{" "}
          <span className="font-mono text-text">{initialOrderId}</span>
        </p>
      )}

      {logs.length === 0 ? (
        <Card className="p-4">
          <p className="text-center text-sm text-text-muted">
            {initialOrderId
              ? "No log entries found for that order reference ID."
              : "No activity logged yet."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">When</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Who</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Action</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Order</th>
                  <th className="px-4 py-3 text-left font-medium text-text-muted">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => {
                  const who = resolveLogPerformer(log);
                  const showEmail =
                    log.action !== "ORDER_SUBMITTED" && log.performedByEmail;

                  return (
                    <tr key={log.id} className="align-top">
                      <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-text">{who}</p>
                        {showEmail && (
                          <p className="text-xs text-text-muted">{log.performedByEmail}</p>
                        )}
                        {log.action === "ORDER_SUBMITTED" && (
                          <p className="text-xs text-text-muted">Requester</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-text">
                          {formatActivityActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/log?orderId=${encodeURIComponent(log.orderId)}`}
                          className="font-mono text-xs text-brand-400 hover:underline"
                        >
                          {log.orderId}
                        </Link>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {log.requesterName}
                          {log.orderDeleted && (
                            <span className="ml-1 text-amber-400">(deleted)</span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-text-muted">
                        {formatActivityDetails(log.details)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
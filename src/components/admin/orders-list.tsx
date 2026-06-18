"use client";

import type { LineItemStatus, OrderActivityAction } from "@prisma/client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { LineItemActions } from "@/components/admin/line-item-actions";
import { OrderDeleteButton } from "@/components/admin/order-delete-button";
import { OrderDenyActions } from "@/components/admin/order-deny-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { PrimeBadge } from "@/components/order/prime-badge";
import { formatCurrency } from "@/lib/amazon-product";
import {
  formatActivityActionLabel,
  formatActivityDetails,
  resolveLogPerformer,
} from "@/lib/order-activity-log-format";
import { formatDate } from "@/lib/utils";

export type AdminOrderItem = {
  id: string;
  description: string;
  quantity: number;
  amazonUrl: string;
  justification: string;
  status: LineItemStatus;
  denialReason: string | null;
  unitPrice: string | null;
  priceCurrency: string | null;
  isPrimeEligible: boolean | null;
  priceLookupError: string | null;
  reviewedAt: string | null;
  reviewedByName: string | null;
};

export type AdminOrderActivityLog = {
  id: string;
  action: OrderActivityAction;
  details: string | null;
  createdAt: string;
  performedByName: string | null;
};

export type AdminOrder = {
  id: string;
  requesterName: string;
  requesterEmail: string;
  departmentName: string;
  submittedAt: string;
  lineItems: AdminOrderItem[];
  activityLogs: AdminOrderActivityLog[];
};

type OrderTab = "awaiting" | "decided";

function orderAwaitingDecision(order: AdminOrder): boolean {
  return order.lineItems.some((item) => item.status === "PENDING");
}

function orderFullyDecided(order: AdminOrder): boolean {
  return (
    order.lineItems.length > 0 &&
    order.lineItems.every((item) => item.status !== "PENDING")
  );
}

export function OrdersList({ orders }: { orders: AdminOrder[] }) {
  const [tab, setTab] = useState<OrderTab>("awaiting");
  const [query, setQuery] = useState("");

  const awaitingOrders = useMemo(
    () => orders.filter(orderAwaitingDecision),
    [orders]
  );
  const decidedOrders = useMemo(() => orders.filter(orderFullyDecided), [orders]);

  const tabOrders = tab === "awaiting" ? awaitingOrders : decidedOrders;

  const filteredOrders = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return tabOrders;
    return tabOrders.filter((order) => order.id.toLowerCase().includes(trimmed));
  }, [tabOrders, query]);

  const pendingItemCount = awaitingOrders.reduce(
    (sum, order) =>
      sum + order.lineItems.filter((item) => item.status === "PENDING").length,
    0
  );

  const emptyMessage =
    orders.length === 0
      ? "No orders yet."
      : query.trim()
        ? "No orders match that reference ID."
        : tab === "awaiting"
          ? "No orders awaiting decision."
          : "No fully decided orders yet.";

  return (
    <div className="space-y-4">
      <div
        className="flex gap-1 border-b border-border"
        role="tablist"
        aria-label="Order views"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "awaiting"}
          onClick={() => setTab("awaiting")}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
            tab === "awaiting"
              ? "border border-b-0 border-border bg-surface-raised text-text"
              : "text-text-muted hover:bg-surface-muted hover:text-text"
          }`}
        >
          Awaiting decision
          {awaitingOrders.length > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
              {awaitingOrders.length}
            </span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "decided"}
          onClick={() => setTab("decided")}
          className={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
            tab === "decided"
              ? "border border-b-0 border-border bg-surface-raised text-text"
              : "text-text-muted hover:bg-surface-muted hover:text-text"
          }`}
        >
          Decided
          {decidedOrders.length > 0 && (
            <span className="ml-1.5 rounded-full bg-surface-muted px-1.5 py-0.5 text-xs text-text-muted">
              {decidedOrders.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-text-muted">
          {tab === "awaiting" ? (
            <>
              Review and approve or deny each line item individually.
              {pendingItemCount > 0 && (
                <span className="ml-2 font-medium text-amber-400">
                  {pendingItemCount} item(s) awaiting review
                </span>
              )}
            </>
          ) : (
            "Orders where every line item has been approved or denied."
          )}
        </p>
        <div className="w-full max-w-xs">
          <label htmlFor="order-search" className="text-xs">
            Search by reference ID
          </label>
          <input
            id="order-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste reference ID..."
          />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="p-4">
          <p className="text-center text-sm text-text-muted">{emptyMessage}</p>
        </Card>
      ) : (
        filteredOrders.map((order) => {
          const orderPendingCount = order.lineItems.filter(
            (item) => item.status === "PENDING"
          ).length;

          return (
            <Card key={order.id} className="space-y-2 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-2">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-text">{order.requesterName}</h2>
                  <p className="text-xs text-text-muted">
                    {order.requesterEmail} · {order.departmentName} ·{" "}
                    {formatDate(order.submittedAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="font-mono text-[11px] text-text-muted">{order.id}</p>
                    <Link
                      href={`/admin/log?orderId=${encodeURIComponent(order.id)}`}
                      className="text-[11px] text-brand-400 hover:underline"
                    >
                      View log
                    </Link>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <OrderDenyActions orderId={order.id} pendingCount={orderPendingCount} />
                    <OrderDeleteButton orderId={order.id} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {order.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 rounded-md border border-border bg-surface-muted/40 p-2 lg:grid-cols-[1fr_auto]"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-sm font-medium text-text">{item.description}</h3>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-xs text-text-muted">
                        Qty {item.quantity}
                        {item.unitPrice != null && (
                          <>
                            {" "}
                            ·{" "}
                            {formatCurrency(
                              Number(item.unitPrice),
                              item.priceCurrency ?? "USD"
                            )}{" "}
                            each
                          </>
                        )}{" "}
                        ·{" "}
                        <a
                          href={item.amazonUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          Amazon
                        </a>
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <PrimeBadge isPrimeEligible={item.isPrimeEligible} />
                        {item.priceLookupError && (
                          <span className="text-[11px] text-amber-400">
                            {item.priceLookupError}
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-xs text-text-muted">
                        <span className="font-medium text-text">Why:</span>{" "}
                        {item.justification}
                      </p>
                      {item.denialReason && (
                        <p className="text-xs text-red-400">{item.denialReason}</p>
                      )}
                      {item.reviewedByName && (
                        <p className="text-[11px] text-text-muted">
                          Reviewed by {item.reviewedByName}
                          {item.reviewedAt && ` · ${formatDate(item.reviewedAt)}`}
                        </p>
                      )}
                    </div>
                    <LineItemActions lineItemId={item.id} status={item.status} />
                  </div>
                ))}
              </div>

              {order.activityLogs.length > 0 && (
                <div className="border-t border-border pt-2">
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    Activity log
                  </p>
                  <ul className="space-y-1">
                    {order.activityLogs.map((log) => (
                      <li key={log.id} className="text-xs text-text-muted">
                        <span className="font-medium text-text">
                          {resolveLogPerformer({
                            action: log.action,
                            performedByName: log.performedByName,
                            requesterName: order.requesterName,
                          })}
                        </span>
                        <span className="text-text">
                          {" "}
                          · {formatActivityActionLabel(log.action).toLowerCase()}
                          {log.details ? ` — ${formatActivityDetails(log.details)}` : ""}
                        </span>
                        <span className="ml-1">· {formatDate(log.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
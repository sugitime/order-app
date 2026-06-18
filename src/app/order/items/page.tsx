"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LineItemFormModal } from "@/components/order/line-item-form-modal";
import { PrimeBadge } from "@/components/order/prime-badge";
import { OrderProgress } from "@/components/order-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  clearOrderDraft,
  getOrderDraft,
  saveOrderDraft,
  type DraftLineItem,
} from "@/lib/order-draft";
import { cn } from "@/lib/utils";

const emptyItem = (): DraftLineItem => ({
  description: "",
  amazonUrl: "",
  quantity: 1,
  justification: "",
});

export default function LineItemsPage() {
  const router = useRouter();
  const [lineItems, setLineItems] = useState<DraftLineItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalItem, setModalItem] = useState<DraftLineItem>(emptyItem());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState({ name: "", department: "" });

  useEffect(() => {
    const draft = getOrderDraft();
    if (
      !draft?.requesterName ||
      !draft.requesterEmail ||
      !draft.departmentName ||
      !draft.acknowledged
    ) {
      router.replace("/order");
      return;
    }
    setSummary({
      name: draft.requesterName,
      department: draft.departmentName,
    });
    setLineItems(draft.lineItems);
  }, [router]);

  function persistLineItems(items: DraftLineItem[]) {
    const draft = getOrderDraft();
    if (draft) {
      saveOrderDraft({ ...draft, lineItems: items });
    }
  }

  function openAddModal() {
    setEditingIndex(null);
    setModalItem(emptyItem());
    setModalOpen(true);
  }

  function openEditModal(index: number) {
    setEditingIndex(index);
    setModalItem({ ...lineItems[index] });
    setModalOpen(true);
  }

  function handleSaveItem(item: DraftLineItem) {
    const nextItems =
      editingIndex === null
        ? [...lineItems, item]
        : lineItems.map((existing, index) =>
            index === editingIndex ? item : existing
          );

    setLineItems(nextItems);
    persistLineItems(nextItems);
    setModalOpen(false);
    setError("");
  }

  function removeItem(index: number) {
    const nextItems = lineItems.filter((_, i) => i !== index);
    setLineItems(nextItems);
    persistLineItems(nextItems);
    setExpandedItems((current) => {
      const next = new Set<number>();
      current.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  }

  function toggleExpanded(index: number) {
    setExpandedItems((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (lineItems.length === 0) {
      setError("Add at least one item before submitting.");
      return;
    }

    const draft = getOrderDraft();
    if (!draft) return;

    saveOrderDraft({ ...draft, lineItems });
    setSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterName: draft.requesterName,
          requesterEmail: draft.requesterEmail,
          departmentName: draft.departmentName,
          acknowledged: true,
          lineItems,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to submit order.");
        return;
      }

      clearOrderDraft();
      router.push(`/order/confirmation?orderId=${data.orderId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <OrderProgress currentStep={3} />
      <Card>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-text">Line items</h2>
            <p className="mt-1 text-sm text-text-muted">
              Add each item you would like to order from Amazon.
            </p>
          </div>
          <div className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-text-muted">
            <span className="font-medium">{summary.name}</span>
            {summary.department && <span> · {summary.department}</span>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {lineItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface-muted/30 px-4 py-8 text-center">
              <p className="text-sm text-text-muted">No items added yet.</p>
              <Button type="button" className="mt-4" onClick={openAddModal}>
                + Add item
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {lineItems.map((item, index) => {
                const expanded = expandedItems.has(index);
                return (
                  <li
                    key={`${item.description}-${index}`}
                    className="overflow-hidden rounded-lg border border-border bg-surface-muted/40"
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(index)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        aria-expanded={expanded}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-600/20 text-xs font-semibold text-brand-400">
                          {item.quantity}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-text">
                            {item.description}
                          </span>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span className="text-xs text-text-muted">
                              {item.priceDisplay ?? "Price unavailable"}
                            </span>
                            <PrimeBadge isPrimeEligible={item.isPrimeEligible} />
                          </div>
                        </div>
                        <svg
                          className={cn(
                            "ml-auto h-4 w-4 shrink-0 text-text-muted transition-transform",
                            expanded && "rotate-180"
                          )}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(index)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => removeItem(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="space-y-2 border-t border-border px-3 py-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                            Unit price
                          </p>
                          <span className="text-text">
                            {item.priceDisplay ?? "Unavailable"}
                          </span>
                          <PrimeBadge isPrimeEligible={item.isPrimeEligible} />
                        </div>
                        {item.priceLookupError && (
                          <p className="text-xs text-amber-400">{item.priceLookupError}</p>
                        )}
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                            Amazon URL
                          </p>
                          <a
                            href={item.amazonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 block break-all"
                          >
                            {item.amazonUrl}
                          </a>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                            Justification
                          </p>
                          <p className="mt-0.5 whitespace-pre-wrap text-text-muted">
                            {item.justification}
                          </p>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {lineItems.length > 0 && (
            <Button type="button" variant="secondary" onClick={openAddModal}>
              + Add item
            </Button>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Link href="/order/disclaimer">
              <Button type="button" variant="secondary">
                Back
              </Button>
            </Link>
            <Button
              type="submit"
              size="lg"
              disabled={submitting || lineItems.length === 0}
            >
              {submitting ? "Submitting..." : "Submit order request"}
            </Button>
          </div>
        </form>
      </Card>

      <LineItemFormModal
        open={modalOpen}
        title={editingIndex === null ? "Add item" : "Edit item"}
        initialItem={modalItem}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveItem}
      />
    </div>
  );
}
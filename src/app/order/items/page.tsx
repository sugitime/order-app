"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderProgress } from "@/components/order-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  clearOrderDraft,
  getOrderDraft,
  saveOrderDraft,
  type DraftLineItem,
} from "@/lib/order-draft";
import { isAmazonUrl } from "@/lib/validators";

const emptyItem = (): DraftLineItem => ({
  description: "",
  amazonUrl: "",
  quantity: 1,
  justification: "",
});

export default function LineItemsPage() {
  const router = useRouter();
  const [lineItems, setLineItems] = useState<DraftLineItem[]>([emptyItem()]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState({ name: "", department: "" });

  useEffect(() => {
    const draft = getOrderDraft();
    if (!draft?.requesterName || !draft.departmentName || !draft.acknowledged) {
      router.replace("/order");
      return;
    }
    setSummary({
      name: draft.requesterName,
      department: draft.departmentName,
    });
    if (draft.lineItems.length > 0) {
      setLineItems(draft.lineItems);
    }
  }, [router]);

  function updateItem(index: number, field: keyof DraftLineItem, value: string | number) {
    setLineItems((items) =>
      items.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setLineItems((items) => [...items, emptyItem()]);
  }

  function removeItem(index: number) {
    setLineItems((items) => (items.length === 1 ? items : items.filter((_, i) => i !== index)));
  }

  function validateItems(): string | null {
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      const label = `Item ${i + 1}`;
      if (!item.description.trim()) return `${label}: description is required.`;
      if (!item.amazonUrl.trim()) return `${label}: Amazon URL is required.`;
      if (!isAmazonUrl(item.amazonUrl.trim())) return `${label}: only Amazon URLs are accepted.`;
      if (!item.quantity || item.quantity < 1) return `${label}: quantity must be at least 1.`;
      if (!item.justification.trim()) return `${label}: justification is required.`;
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const validationError = validateItems();
    if (validationError) {
      setError(validationError);
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className="space-y-4 rounded-lg border border-border bg-surface-muted/50 p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-text">Item {index + 1}</h3>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div>
                <label>Item description</label>
                <input
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  placeholder="e.g. USB-C hub, 7-port"
                />
              </div>

              <div>
                <label>Amazon URL</label>
                <input
                  value={item.amazonUrl}
                  onChange={(e) => updateItem(index, "amazonUrl", e.target.value)}
                  placeholder="https://www.amazon.com/dp/..."
                  type="url"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label>Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", parseInt(e.target.value, 10) || 1)
                    }
                  />
                </div>
                <div className="sm:col-span-1" />
              </div>

              <div>
                <label>Justification</label>
                <textarea
                  rows={3}
                  value={item.justification}
                  onChange={(e) => updateItem(index, "justification", e.target.value)}
                  placeholder="Why is this item needed for your work?"
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="secondary" onClick={addItem}>
            + Add another item
          </Button>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Link href="/order/disclaimer">
              <Button type="button" variant="secondary">
                Back
              </Button>
            </Link>
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit order request"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
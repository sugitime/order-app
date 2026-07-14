"use client";

import type { LineItemStatus } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { canEditLineItemQuantity } from "@/lib/line-item-quantity";

export function LineItemQuantityEditor({
  lineItemId,
  quantity,
  status,
  className,
}: {
  lineItemId: string;
  quantity: number;
  status: LineItemStatus;
  className?: string;
}) {
  const router = useRouter();
  const canEdit = canEditLineItemQuantity(status);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(quantity));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function startEditing() {
    setValue(String(quantity));
    setEditing(true);
    setError("");
  }

  function cancelEditing() {
    setValue(String(quantity));
    setEditing(false);
    setError("");
  }

  async function save() {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 999) {
      setError("Quantity must be between 1 and 999");
      return;
    }

    if (parsed === quantity) {
      setEditing(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/line-items/${lineItemId}/quantity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: parsed }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to update quantity");
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!canEdit) {
    return <span className={className}>Qty {quantity}</span>;
  }

  if (!editing) {
    return (
      <span className={`inline-flex flex-wrap items-center gap-1.5 ${className ?? ""}`}>
        <span>Qty {quantity}</span>
        <button
          type="button"
          onClick={startEditing}
          className="text-[11px] text-brand-400 hover:underline"
        >
          Edit
        </button>
      </span>
    );
  }

  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`qty-${lineItemId}`} className="text-xs text-text-muted">
          Qty
        </label>
        <input
          id={`qty-${lineItemId}`}
          type="number"
          min={1}
          max={999}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-20"
          disabled={loading}
        />
        <Button type="button" size="sm" onClick={save} disabled={loading}>
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={cancelEditing}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export type AmazonOrderNumberEntry = {
  id?: string;
  orderNumber: string;
};

type EditorRow = {
  key: string;
  orderNumber: string;
};

function createRow(orderNumber = ""): EditorRow {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    orderNumber,
  };
}

export function OrderAmazonNumbersEditor({
  orderId,
  initialNumbers,
  compact = false,
}: {
  orderId: string;
  initialNumbers: AmazonOrderNumberEntry[];
  compact?: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<EditorRow[]>(() =>
    initialNumbers.length > 0
      ? initialNumbers.map((entry) => createRow(entry.orderNumber))
      : [createRow()]
  );
  const [editing, setEditing] = useState(initialNumbers.length === 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const savedNumbers = initialNumbers.map((entry) => entry.orderNumber);
  const hasSavedNumbers = savedNumbers.length > 0;

  function updateRow(key: string, orderNumber: string) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, orderNumber } : row))
    );
  }

  function addRow() {
    setRows((current) => [...current, createRow()]);
    setEditing(true);
  }

  function removeRow(key: string) {
    setRows((current) => {
      const next = current.filter((row) => row.key !== key);
      return next.length > 0 ? next : [createRow()];
    });
    setEditing(true);
  }

  async function save() {
    setLoading(true);
    setError("");

    const orderNumbers = rows
      .map((row) => row.orderNumber.trim())
      .filter(Boolean);

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}/amazon-order-numbers`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumbers }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to save Amazon order numbers");
        return;
      }

      const saved = (data.orderNumbers as AmazonOrderNumberEntry[]) ?? [];
      setRows(
        saved.length > 0
          ? saved.map((entry) => createRow(entry.orderNumber))
          : [createRow()]
      );
      setEditing(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function startEditing() {
    setRows(
      hasSavedNumbers
        ? savedNumbers.map((orderNumber) => createRow(orderNumber))
        : [createRow()]
    );
    setEditing(true);
    setError("");
  }

  function cancelEditing() {
    setRows(
      hasSavedNumbers
        ? savedNumbers.map((orderNumber) => createRow(orderNumber))
        : [createRow()]
    );
    setEditing(false);
    setError("");
  }

  if (!editing) {
    return (
      <div className={compact ? "space-y-1" : "space-y-2"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Amazon order numbers
          </p>
          <Button size="sm" variant="secondary" onClick={startEditing}>
            {hasSavedNumbers ? "Edit" : "Add"}
          </Button>
        </div>
        {hasSavedNumbers ? (
          <ul className="space-y-1">
            {savedNumbers.map((orderNumber) => (
              <li
                key={orderNumber}
                className="font-mono text-xs text-text"
              >
                {orderNumber}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-text-muted">No Amazon order numbers yet.</p>
        )}
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        Amazon order numbers
      </p>
      <p className="text-xs text-text-muted">
        Add every Amazon order ID for this request. Use multiple entries when Amazon
        splits the shipment.
      </p>

      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={row.key} className="flex items-center gap-2">
            <input
              value={row.orderNumber}
              onChange={(e) => updateRow(row.key, e.target.value)}
              placeholder="e.g. 123-4567890-1234567"
              aria-label={`Amazon order number ${index + 1}`}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => removeRow(row.key)}
              disabled={rows.length === 1 && !row.orderNumber.trim()}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={addRow}>
          Add another
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={loading}>
          Save
        </Button>
        {hasSavedNumbers && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={cancelEditing}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
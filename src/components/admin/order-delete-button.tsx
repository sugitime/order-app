"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function OrderDeleteButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function deleteOrder() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/delete`, {
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to delete order");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setShowConfirm((value) => !value)}
        disabled={loading}
      >
        Delete order
      </Button>

      {showConfirm && (
        <div className="space-y-2 rounded-lg border border-border bg-surface-muted/60 p-2">
          <p className="text-xs text-text-muted">
            This hides the order from the Orders page. It is not permanently removed from the
            database.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="danger" onClick={deleteOrder} disabled={loading}>
              {loading ? "Deleting..." : "Confirm delete"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowConfirm(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
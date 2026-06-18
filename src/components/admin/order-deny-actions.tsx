"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function OrderDenyActions({
  orderId,
  pendingCount,
}: {
  orderId: string;
  pendingCount: number;
}) {
  const router = useRouter();
  const [showDeny, setShowDeny] = useState(false);
  const [denialReason, setDenialReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (pendingCount === 0) return null;

  async function denyOrder() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ denialReason }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to deny order");
        return;
      }

      setShowDeny(false);
      setDenialReason("");
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
        variant="danger"
        onClick={() => setShowDeny((value) => !value)}
        disabled={loading}
      >
        Deny entire order
      </Button>

      {showDeny && (
        <div className="space-y-2 rounded-lg border border-red-800/50 bg-red-950/30 p-2">
          <label className="text-xs text-red-300">
            Reason for denying all {pendingCount} pending item(s)
          </label>
          <textarea
            rows={2}
            value={denialReason}
            onChange={(e) => setDenialReason(e.target.value)}
            placeholder="Explain why this order cannot be fulfilled"
            className="text-sm"
          />
          <Button
            size="sm"
            variant="danger"
            onClick={denyOrder}
            disabled={loading || !denialReason.trim()}
          >
            Confirm deny all
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
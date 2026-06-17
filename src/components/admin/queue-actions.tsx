"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function QueueItemActions({
  lineItemId,
  status,
}: {
  lineItemId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [amazonOrderId, setAmazonOrderId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [error, setError] = useState("");

  async function processAuto() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/queue/${lineItemId}/process`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Auto-order failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function completeManual() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/queue/${lineItemId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amazonOrderId, trackingNumber }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to save order details");
        return;
      }
      setShowManual(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (status === "ORDERED") {
    return <span className="text-xs text-slate-400">Completed</span>;
  }

  return (
    <div className="space-y-2">
      {(status === "QUEUED" || status === "FAILED") && (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={processAuto} disabled={loading}>
            Auto-order
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowManual((v) => !v)}
            disabled={loading}
          >
            Enter manually
          </Button>
        </div>
      )}

      {showManual && (
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <label>Amazon Order ID</label>
            <input
              value={amazonOrderId}
              onChange={(e) => setAmazonOrderId(e.target.value)}
              placeholder="e.g. 123-4567890-1234567"
            />
          </div>
          <div>
            <label>Tracking number (optional)</label>
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Carrier tracking number"
            />
          </div>
          <Button
            size="sm"
            onClick={completeManual}
            disabled={loading || !amazonOrderId.trim()}
          >
            Save order details
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
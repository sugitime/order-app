"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LineItemActions({
  lineItemId,
  status,
}: {
  lineItemId: string;
  status: string;
}) {
  const router = useRouter();
  const [denialReason, setDenialReason] = useState("");
  const [showDeny, setShowDeny] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status !== "PENDING") return null;

  async function review(action: "approve" | "deny") {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/line-items/${lineItemId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          denialReason: action === "deny" ? denialReason : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Action failed");
        return;
      }

      setShowDeny(false);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => review("approve")} disabled={loading}>
          Approve
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => setShowDeny((v) => !v)}
          disabled={loading}
        >
          Deny
        </Button>
      </div>

      {showDeny && (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <label className="text-red-800">Reason for denial</label>
          <textarea
            rows={2}
            value={denialReason}
            onChange={(e) => setDenialReason(e.target.value)}
            placeholder="Explain why this item cannot be ordered"
          />
          <Button
            size="sm"
            variant="danger"
            onClick={() => review("deny")}
            disabled={loading || !denialReason.trim()}
          >
            Confirm denial
          </Button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
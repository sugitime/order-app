"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ProcessAllButton({ count }: { count: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function processAll() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/queue/process-all", { method: "POST" });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Failed to process queue");
        return;
      }
      setMessage(`Processed ${data.processed} item(s).`);
      router.refresh();
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3">
      <Button onClick={processAll} disabled={loading}>
        {loading ? "Processing..." : `Auto-order all (${count})`}
      </Button>
      {message && <span className="text-sm text-text-muted">{message}</span>}
    </div>
  );
}
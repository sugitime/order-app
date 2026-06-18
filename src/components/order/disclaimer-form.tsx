"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderProgress } from "@/components/order-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOrderDraft, saveOrderDraft } from "@/lib/order-draft";
import type { DisclaimerConfig } from "@/types/config";

export function DisclaimerForm({ disclaimer }: { disclaimer: DisclaimerConfig }) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const draft = getOrderDraft();
    if (!draft?.requesterName || !draft.requesterEmail || !draft.departmentName) {
      router.replace("/order");
      return;
    }
    setAcknowledged(draft.acknowledged);
  }, [router]);

  function handleAcknowledgeChange(checked: boolean) {
    setAcknowledged(checked);
    setError("");
    const draft = getOrderDraft();
    if (draft) {
      saveOrderDraft({ ...draft, acknowledged: checked });
    }
  }

  function handleContinue(event: React.FormEvent) {
    event.preventDefault();
    const draft = getOrderDraft();
    if (!draft) return;

    if (!acknowledged) {
      setError("You must acknowledge this disclaimer before continuing.");
      return;
    }

    saveOrderDraft({ ...draft, acknowledged: true });
    router.push("/order/items");
  }

  return (
    <div>
      <OrderProgress currentStep={2} />
      <Card>
        <h2 className="mb-4 text-xl font-semibold text-text">{disclaimer.title}</h2>

        <div
          className="disclaimer-content mb-6 space-y-4 rounded-lg border border-amber-700/50 bg-amber-950/40 p-4 text-sm leading-relaxed text-amber-200 [&_a]:text-amber-100 [&_a]:underline [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p+_p]:mt-4 [&_ul]:list-disc [&_ul]:pl-4"
          dangerouslySetInnerHTML={{ __html: disclaimer.bodyHtml }}
        />

        <form onSubmit={handleContinue} className="space-y-6">
          <div className="rounded-lg border border-border bg-surface-muted/40 p-4">
            <label htmlFor="acknowledge" className="cursor-pointer">
              <input
                id="acknowledge"
                type="checkbox"
                required
                checked={acknowledged}
                onChange={(e) => handleAcknowledgeChange(e.target.checked)}
              />
              <span className="text-sm leading-relaxed text-text">
                {disclaimer.acknowledgmentText}
                <span className="text-red-400"> *</span>
              </span>
            </label>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Link href="/order">
              <Button type="button" variant="secondary">
                Back
              </Button>
            </Link>
            <Button type="submit" size="lg">
              Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
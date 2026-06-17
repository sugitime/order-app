"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OrderProgress } from "@/components/order-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOrderDraft, saveOrderDraft } from "@/lib/order-draft";

export default function DisclaimerPage() {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    const draft = getOrderDraft();
    if (!draft?.requesterName || !draft.departmentId) {
      router.replace("/order");
      return;
    }
    setAcknowledged(draft.acknowledged);
  }, [router]);

  function handleContinue(event: React.FormEvent) {
    event.preventDefault();
    const draft = getOrderDraft();
    if (!draft) return;

    if (!acknowledged) return;

    saveOrderDraft({ ...draft, acknowledged: true });
    router.push("/order/items");
  }

  return (
    <div>
      <OrderProgress currentStep={2} />
      <Card>
        <h2 className="mb-4 text-xl font-semibold text-text">Before you order</h2>

        <div className="mb-6 space-y-4 rounded-lg border border-amber-700/50 bg-amber-950/40 p-4 text-sm leading-relaxed text-amber-200">
          <p>
            QM is not storing anything you order. Consider it disposable, or find a way to
            store it yourself.
          </p>
          <p>
            Please do not order pens, power strips, tape, or paper. QM keeps stock of these
            items and can hand them out to people who need them.
          </p>
        </div>

        <form onSubmit={handleContinue} className="space-y-6">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 hover:bg-surface-muted">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            />
            <span className="text-sm leading-relaxed text-text-muted">
              I acknowledge that QM cannot store anything for me and I am responsible for
              storing everything I order, or disposing of it and reordering next year.
            </span>
          </label>

          <div className="flex items-center justify-between gap-3">
            <Link href="/order">
              <Button type="button" variant="secondary">
                Back
              </Button>
            </Link>
            <Button type="submit" size="lg" disabled={!acknowledged}>
              Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
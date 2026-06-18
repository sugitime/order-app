"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderProgress } from "@/components/order-progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  createEmptyDraft,
  getOrderDraft,
  saveOrderDraft,
} from "@/lib/order-draft";

export default function OrderStepOnePage() {
  const router = useRouter();
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const draft = getOrderDraft() ?? createEmptyDraft();
    setRequesterName(draft.requesterName);
    setRequesterEmail(draft.requesterEmail);
    setDepartmentName(draft.departmentName);
  }, []);

  function handleContinue(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!requesterName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!requesterEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!departmentName.trim()) {
      setError("Please enter your department.");
      return;
    }

    const draft = getOrderDraft() ?? createEmptyDraft();
    saveOrderDraft({
      ...draft,
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.trim().toLowerCase(),
      departmentName: departmentName.trim(),
    });
    router.push("/order/disclaimer");
  }

  return (
    <div>
      <OrderProgress currentStep={1} />
      <Card>
        <h2 className="mb-1 text-xl font-semibold text-text">Your information</h2>
        <p className="mb-6 text-sm text-text-muted">
          Tell us who you are and which department this order is for.
        </p>

        <form onSubmit={handleContinue} className="space-y-4">
          <div>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={requesterEmail}
              onChange={(e) => setRequesterEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="department">Department</label>
            <input
              id="department"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="E.g. Vendors, Exhibitors, Villages, etc."
              autoComplete="organization"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end pt-2">
            <Button type="submit" size="lg">
              Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
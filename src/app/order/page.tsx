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

type Department = { id: string; name: string };

export default function OrderStepOnePage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [requesterName, setRequesterName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const draft = getOrderDraft() ?? createEmptyDraft();
    setRequesterName(draft.requesterName);
    setDepartmentId(draft.departmentId);

    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => setDepartments(data.departments ?? []))
      .finally(() => setLoading(false));
  }, []);

  function handleContinue(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!requesterName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!departmentId) {
      setError("Please select a department.");
      return;
    }

    const departmentName = departments.find((d) => d.id === departmentId)?.name;
    const draft = getOrderDraft() ?? createEmptyDraft();
    saveOrderDraft({
      ...draft,
      requesterName: requesterName.trim(),
      departmentId,
      departmentName,
    });
    router.push("/order/disclaimer");
  }

  return (
    <div>
      <OrderProgress currentStep={1} />
      <Card>
        <h2 className="mb-1 text-xl font-semibold text-slate-900">Your information</h2>
        <p className="mb-6 text-sm text-slate-500">
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
            <label htmlFor="department">Department</label>
            <select
              id="department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

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
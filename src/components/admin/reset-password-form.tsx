"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Reset link is invalid. Request a new one.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to reset password");
        return;
      }

      router.push("/admin/login?reset=success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Card className="text-center">
        <h1 className="text-xl font-semibold text-text">Invalid reset link</h1>
        <p className="mt-2 text-sm text-text-muted">
          This password reset link is missing or invalid.
        </p>
        <Link href="/admin/forgot-password" className="mt-4 inline-block text-sm">
          Request a new link
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
          QM Admin
        </p>
        <h1 className="mt-1 text-xl font-semibold text-text">Set new password</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Saving..." : "Update password"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        <Link href="/admin/login">← Back to sign in</Link>
      </p>
    </Card>
  );
}
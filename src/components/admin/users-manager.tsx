"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "APPROVER";
  createdAt: Date | string;
};

export function UsersManager({ initialUsers }: { initialUsers: UserRow[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "APPROVER">("APPROVER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Failed to create user");
        return;
      }

      setUsers((prev) => [data.user, ...prev]);
      setName("");
      setEmail("");
      setPassword("");
      setRole("APPROVER");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <h2 className="mb-4 font-semibold text-slate-900">Create user</h2>
        <form onSubmit={createUser} className="space-y-4">
          <div>
            <label htmlFor="user-name">Name</label>
            <input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="user-email">Email</label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="user-password">Password</label>
            <input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div>
            <label htmlFor="user-role">Role</label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "ADMIN" | "APPROVER")}
            >
              <option value="APPROVER">Approver</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create user"}
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">Existing users</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="font-medium text-slate-900">{user.name}</p>
                <p className="text-sm text-slate-500">{user.email}</p>
                <p className="text-xs text-slate-400">Added {formatDate(user.createdAt)}</p>
              </div>
              <span
                className={
                  user.role === "ADMIN"
                    ? "rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700"
                    : "rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                }
              >
                {user.role}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
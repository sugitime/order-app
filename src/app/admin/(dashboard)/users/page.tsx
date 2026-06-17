export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { UsersManager } from "@/components/admin/users-manager";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/orders");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Users</h1>
        <p className="mt-1 text-sm text-text-muted">
          Create admin and approver accounts for the backend.
        </p>
      </div>
      <UsersManager initialUsers={users} />
    </div>
  );
}
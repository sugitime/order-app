export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { Card } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth";

export default async function AccountSettingsPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text">Account</h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your sign-in credentials and view your profile.
        </p>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold text-text">Profile</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Name</p>
            <p className="text-sm text-text">{user.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Email</p>
            <p className="text-sm text-text">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Role</p>
            <p className="text-sm text-text">{user.role}</p>
          </div>
        </div>
      </Card>

      <ChangePasswordForm />
    </div>
  );
}
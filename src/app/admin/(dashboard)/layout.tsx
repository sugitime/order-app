import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { destroySession, getSessionUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admin/login");
  }

  return (
    <>
      <header className="border-b border-border bg-surface-raised">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
              QM Admin
            </p>
            <p className="text-sm text-text-muted">
              Signed in as <span className="font-medium text-text">{user.name}</span>
              {user.role === "ADMIN" && (
                <span className="ml-2 rounded bg-brand-600/20 px-2 py-0.5 text-xs text-brand-400">
                  Admin
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <AdminNav />
            <form>
              <button
                formAction={async () => {
                  "use server";
                  await destroySession();
                  redirect("/admin/login");
                }}
                className="text-sm text-text-muted hover:text-red-400"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
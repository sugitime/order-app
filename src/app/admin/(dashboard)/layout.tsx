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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              QM Admin
            </p>
            <p className="text-sm text-slate-500">
              Signed in as <span className="font-medium text-slate-800">{user.name}</span>
              {user.role === "ADMIN" && (
                <span className="ml-2 rounded bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
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
                className="text-sm text-slate-500 hover:text-red-600"
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
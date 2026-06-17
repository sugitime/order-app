import Link from "next/link";

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Quality Management
            </p>
            <h1 className="text-lg font-semibold text-slate-900">Order Request</h1>
          </div>
          <Link href="/admin/login" className="text-sm text-slate-500 hover:text-brand-600">
            Admin
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
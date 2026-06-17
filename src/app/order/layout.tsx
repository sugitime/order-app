import Link from "next/link";

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface via-surface-raised to-surface">
      <header className="border-b border-border bg-surface-raised/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-400">
              Quality Management
            </p>
            <h1 className="text-lg font-semibold text-text">Order Request</h1>
          </div>
          <Link href="/admin/login" className="text-sm text-text-muted">
            Admin
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
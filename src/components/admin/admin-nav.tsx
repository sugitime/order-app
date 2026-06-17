"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/orders", label: "Orders", adminOnly: false },
  { href: "/admin/queue", label: "Order Queue", adminOnly: false },
  { href: "/admin/users", label: "Users", adminOnly: true },
  { href: "/admin/settings", label: "Settings", adminOnly: true },
];

export function AdminNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRole(data?.user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  const visibleLinks = links.filter(
    (link) => !link.adminOnly || role === "ADMIN"
  );

  return (
    <nav className="flex flex-wrap gap-2">
      {visibleLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition",
            pathname.startsWith(link.href)
              ? "bg-brand-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
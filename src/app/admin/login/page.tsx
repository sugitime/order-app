import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="text-center text-slate-500">Loading...</p>}>
      <LoginForm />
    </Suspense>
  );
}
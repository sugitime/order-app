import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/admin/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-center text-text-muted">Loading...</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
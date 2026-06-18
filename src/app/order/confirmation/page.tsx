import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-900/40 text-2xl text-green-400 ring-1 ring-green-700/50">
        ✓
      </div>
      <h2 className="mb-2 text-xl font-semibold text-text">Thanks for submitting.</h2>
      <p className="mb-6 text-sm leading-relaxed text-text-muted">
        You&apos;ll get an email when the items are ordered.
      </p>
      {params.orderId && (
        <p className="mb-6 text-xs text-text-muted">Reference: {params.orderId}</p>
      )}
      <Link href="/order">
        <Button>Submit another request</Button>
      </Link>
    </Card>
  );
}
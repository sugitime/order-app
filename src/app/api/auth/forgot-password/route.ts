import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/password-reset";
import { z } from "zod";

const forgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    await requestPasswordReset(parsed.data.email);

    return NextResponse.json({
      message:
        "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
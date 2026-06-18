import { NextResponse } from "next/server";
import { hashPassword, requireSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentValid = await verifyPassword(
      parsed.data.currentPassword,
      user.passwordHash
    );

    if (!currentValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import { sendMail } from "@/lib/mail";
import { accountRejectedEmail } from "@/lib/emailTemplates";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const userId = Number(id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
  }

  try {
    const { reason } = (await request.json().catch(() => ({}))) as { reason?: string };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    const { subject, html } = accountRejectedEmail(updatedUser.fullName, reason);
    await sendMail({ to: updatedUser.emailId, subject, html });

    return NextResponse.json({ message: "Registration rejected" });
  } catch (error) {
    console.error("[admin/registrations/reject]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

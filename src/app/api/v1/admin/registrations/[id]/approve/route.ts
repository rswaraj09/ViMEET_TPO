import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import { sendMail } from "@/lib/mail";
import { accountApprovedEmail } from "@/lib/emailTemplates";

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
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true, isActive: true },
    });

    const { subject, html } = accountApprovedEmail(updatedUser.fullName);
    await sendMail({ to: updatedUser.emailId, subject, html });

    return NextResponse.json({ message: "Registration approved" });
  } catch (error) {
    console.error("[admin/registrations/approve]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

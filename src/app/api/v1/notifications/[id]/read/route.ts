import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/apiAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });
    return NextResponse.json({ message: "Marked as read." });
  } catch (error) {
    console.error("[notifications/[id]/read]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

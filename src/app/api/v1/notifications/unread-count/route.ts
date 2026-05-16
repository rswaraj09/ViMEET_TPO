import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });
    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("[notifications/unread-count GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

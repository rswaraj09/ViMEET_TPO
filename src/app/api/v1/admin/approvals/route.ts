import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const pending = await prisma.user.findMany({
      where: { isVerified: false, isActive: true },
      select: { id: true, fullName: true, emailId: true, role: true, department: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ pending });
  } catch (error) {
    console.error("[admin/approvals GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const { userId, action } = await request.json();
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: action === "approve",
        isActive: action === "approve",
      },
    });
    return NextResponse.json({ message: `User ${action}d.`, user: updated });
  } catch (error) {
    console.error("[admin/approvals PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

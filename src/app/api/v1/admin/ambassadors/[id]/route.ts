import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.ambassadorAssignment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await prisma.ambassadorAssignment.delete({ where: { id } });
    return NextResponse.json({ message: "Assignment deleted" });
  } catch (error) {
    console.error("[admin/ambassadors DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

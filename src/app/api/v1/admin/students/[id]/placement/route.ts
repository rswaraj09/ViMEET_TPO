import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

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
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  const { isPlaced } = await request.json() as { isPlaced: boolean };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isPlaced },
    });
    return NextResponse.json({ message: isPlaced ? "Marked as placed" : "Placement removed" });
  } catch (error) {
    console.error("[admin/students/placement]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

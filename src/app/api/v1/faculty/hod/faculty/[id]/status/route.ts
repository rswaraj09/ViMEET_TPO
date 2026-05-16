import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY" || !user.isHOD) return forbidden();

  const { id } = await params;
  const targetId = Number(id);
  if (Number.isNaN(targetId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { role: true, department: true },
    });

    if (!target || target.role !== "FACULTY") {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (target.department !== user.department) return forbidden();
    // HOD cannot deactivate themselves
    if (targetId === user.id) {
      return NextResponse.json({ message: "Cannot change your own status" }, { status: 400 });
    }

    const { isActive } = await request.json() as { isActive: boolean };

    const faculty = await prisma.user.update({
      where: { id: targetId },
      data: { isActive },
      select: {
        id: true,
        fullName: true,
        emailId: true,
        contactNo: true,
        department: true,
        isHOD: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ faculty });
  } catch (error) {
    console.error("[faculty/hod/faculty/[id]/status PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

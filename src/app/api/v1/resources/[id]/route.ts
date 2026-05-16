import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  if (user.role !== "ADMIN" && !(user.role === "FACULTY" && user.isHOD)) {
    return forbidden();
  }

  const { id } = await params;

  try {
    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Resource not found" }, { status: 404 });
    }

    // HOD can only edit their own dept's resources
    if (user.role === "FACULTY" && existing.department !== user.department) {
      return forbidden();
    }

    const body = await request.json();
    const { title, description, fileType, academicYear, isActive } = body;

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(fileType !== undefined && { fileType: fileType as any }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(academicYear !== undefined && { academicYear: (academicYear as any) ?? null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        addedBy: { select: { fullName: true, role: true, isHOD: true, department: true } },
      },
    });

    return NextResponse.json({ resource });
  } catch (error) {
    console.error("[resources/:id PUT]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  // Only admin can delete
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.resource.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ message: "Resource not found" }, { status: 404 });
    }

    await prisma.resource.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("[resources/:id DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

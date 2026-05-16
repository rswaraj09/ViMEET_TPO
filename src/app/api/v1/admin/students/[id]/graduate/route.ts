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

  try {
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!student) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (student.role !== "STUDENT") {
      return NextResponse.json({ message: "User is not a student" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: "ALUMNI" },
    });

    return NextResponse.json({ message: "Student graduated to alumni" });
  } catch (error) {
    console.error("[admin/students/graduate]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

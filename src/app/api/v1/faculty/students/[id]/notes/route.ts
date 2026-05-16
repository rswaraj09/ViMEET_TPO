import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  const { id } = await params;
  const studentId = Number(id);
  if (Number.isNaN(studentId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { department: true },
    });
    if (!student || student.department !== user.department) return forbidden();

    const notes = await prisma.studentNote.findMany({
      where: { studentId },
      include: {
        author: { select: { id: true, fullName: true, role: true, profilePic: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("[faculty/students/notes GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  const { id } = await params;
  const studentId = Number(id);
  if (Number.isNaN(studentId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { department: true },
    });
    if (!student || student.department !== user.department) return forbidden();

    const { content } = await request.json() as { content: string };
    if (!content?.trim()) {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    const note = await prisma.studentNote.create({
      data: { studentId, authorId: user.id, content: content.trim() },
      include: {
        author: { select: { id: true, fullName: true, role: true, profilePic: true } },
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("[faculty/students/notes POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

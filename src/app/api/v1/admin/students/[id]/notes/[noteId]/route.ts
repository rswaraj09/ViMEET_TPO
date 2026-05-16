import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["ADMIN", "FACULTY"].includes(user.role)) return forbidden();

  const { id, noteId } = await params;
  const studentId = Number(id);
  if (Number.isNaN(studentId)) {
    return NextResponse.json({ message: "Invalid student id" }, { status: 400 });
  }

  try {
    const note = await prisma.studentNote.findUnique({ where: { id: noteId } });
    if (!note || note.studentId !== studentId) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await prisma.studentNote.delete({ where: { id: noteId } });
    return NextResponse.json({ message: "Note deleted" });
  } catch (error) {
    console.error("[admin/students/notes DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

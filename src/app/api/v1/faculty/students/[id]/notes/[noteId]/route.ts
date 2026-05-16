import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  const { id, noteId } = await params;
  const studentId = Number(id);
  if (Number.isNaN(studentId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    const note = await prisma.studentNote.findUnique({
      where: { id: noteId },
      include: { student: { select: { department: true } } },
    });

    if (!note) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (note.studentId !== studentId) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (note.student.department !== user.department) return forbidden();
    // Faculty can only delete their own notes
    if (note.authorId !== user.id) return forbidden();

    await prisma.studentNote.delete({ where: { id: noteId } });

    return NextResponse.json({ message: "Note deleted" });
  } catch (error) {
    console.error("[faculty/students/notes/[noteId] DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

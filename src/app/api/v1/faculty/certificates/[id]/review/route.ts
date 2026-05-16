import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  const { id } = await params;
  const { isVerified, remarks } = await request.json() as { isVerified: boolean; remarks?: string };

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: { student: { select: { department: true } } },
    });

    if (!certificate) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (certificate.student.department !== user.department) return forbidden();

    await prisma.certificate.update({ where: { id }, data: { isVerified } });

    if (remarks) {
      await prisma.studentNote.create({
        data: { studentId: certificate.userId, authorId: user.id, content: remarks },
      });
    }

    return NextResponse.json({ message: "Review submitted" });
  } catch (error) {
    console.error("[faculty/certificates/review POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

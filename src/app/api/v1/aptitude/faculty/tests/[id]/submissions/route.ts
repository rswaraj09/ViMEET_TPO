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
  const testId = Number(id);
  if (Number.isNaN(testId)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  try {
    const test = await prisma.aptitudeTest.findFirst({
      where: { id: testId, createdById: user.id },
      include: { questions: true, _count: { select: { questions: true, submissions: true } } },
    });
    if (!test) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const items = await prisma.testSubmission.findMany({
      where: { testId },
      include: {
        student: {
          select: {
            id: true, fullName: true, emailId: true,
            studentId: true, department: true, academicYear: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ items, test });
  } catch (error) {
    console.error("[aptitude/faculty/tests/[id]/submissions GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

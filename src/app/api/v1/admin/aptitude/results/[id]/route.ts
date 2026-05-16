import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const testId = Number((await params).id);
  if (isNaN(testId)) {
    return NextResponse.json({ message: "Invalid test id" }, { status: 400 });
  }

  try {
    const test = await prisma.aptitudeTest.findUnique({
      where: { id: testId },
      include: {
        questions: { orderBy: { id: "asc" } },
        sections: { orderBy: { order: "asc" } },
        createdBy: { select: { fullName: true, department: true } },
      },
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    const submissions = await prisma.testSubmission.findMany({
      where: { testId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            emailId: true,
            studentId: true,
            department: true,
            academicYear: true,
          },
        },
      },
      orderBy: { startedAt: "asc" },
    });

    // Find absent students: users in eligible dept/year who never started
    const where: Record<string, unknown> = {
      role: "STUDENT",
      isActive: true,
      isVerified: true,
    };
    if (test.department) where.department = test.department;
    if (test.eligibleYears.length > 0) {
      where.academicYear = { in: test.eligibleYears };
    }

    const eligibleStudents = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        emailId: true,
        studentId: true,
        department: true,
        academicYear: true,
      },
    });

    const attemptedIds = new Set(submissions.map((s) => s.studentId));
    const absentStudents = eligibleStudents.filter((s) => !attemptedIds.has(s.id));

    return NextResponse.json({ test, submissions, absentStudents });
  } catch (error) {
    console.error("[admin/aptitude/results/:id GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

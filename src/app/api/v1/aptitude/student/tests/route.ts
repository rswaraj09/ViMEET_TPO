import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  try {
    const student = await prisma.user.findUnique({
      where: { id: user.id },
      select: { department: true, academicYear: true },
    });

    const tests = await prisma.aptitudeTest.findMany({
      where: {
        status: "PUBLISHED",
        isActive: true,
        AND: [
          {
            OR: [
              { department: null },
              { department: student?.department ?? undefined },
            ],
          },
          {
            OR: [
              { eligibleYears: { isEmpty: true } },
              { eligibleYears: { has: student?.academicYear ?? undefined } },
            ],
          },
        ],
      },
      include: {
        _count: { select: { questions: true, submissions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mySubmissions = await prisma.testSubmission.findMany({
      where: { studentId: user.id },
      select: {
        id: true,
        testId: true,
        attemptNumber: true,
        status: true,
        autoScore: true,
        finalScore: true,
        submittedAt: true,
      },
    });

    const items = tests.map((t) => ({
      ...t,
      mySubmissions: mySubmissions.filter((s) => s.testId === t.id),
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[aptitude/student/tests GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

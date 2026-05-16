import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  try {
    const { id } = await params;
    const testId = Number(id);

    if (isNaN(testId)) {
      return NextResponse.json({ message: "Invalid test ID" }, { status: 400 });
    }

    const test = await prisma.aptitudeTest.findUnique({
      where: { id: testId },
      include: { questions: true },
    });

    if (!test) {
      return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    if (test.status !== "PUBLISHED" || !test.isActive) {
      return NextResponse.json({ message: "Test is not available" }, { status: 400 });
    }

    const attemptCount = await prisma.testSubmission.count({
      where: { testId, studentId: user.id },
    });

    if (attemptCount >= test.allowedAttempts) {
      return NextResponse.json({ message: "No attempts remaining" }, { status: 400 });
    }

    const inProgress = await prisma.testSubmission.findFirst({
      where: { testId, studentId: user.id, status: "IN_PROGRESS" },
    });

    if (inProgress) {
      const safeQuestions = test.questions.map(({ correctOption: _omit, ...q }) => q);
      return NextResponse.json({
        test: {
          id: test.id,
          title: test.title,
          description: test.description,
          rules: test.rules,
          totalTime: test.totalTime,
          totalMarks: test.totalMarks,
          tabSwitchLimit: test.tabSwitchLimit,
          isHomework: test.isHomework,
          questions: safeQuestions,
        },
        submission: {
          id: inProgress.id,
          startedAt: inProgress.startedAt,
          attemptNumber: inProgress.attemptNumber,
          answers: inProgress.answers,
          tabSwitchCount: inProgress.tabSwitchCount,
        },
      });
    }

    const submission = await prisma.testSubmission.create({
      data: {
        testId,
        studentId: user.id,
        attemptNumber: attemptCount + 1,
        answers: {},
        status: "IN_PROGRESS",
      },
    });

    const safeQuestions = test.questions.map(({ correctOption: _omit, ...q }) => q);

    return NextResponse.json({
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        rules: test.rules,
        totalTime: test.totalTime,
        totalMarks: test.totalMarks,
        tabSwitchLimit: test.tabSwitchLimit,
        isHomework: test.isHomework,
        questions: safeQuestions,
      },
      submission: {
        id: submission.id,
        startedAt: submission.startedAt,
        attemptNumber: submission.attemptNumber,
        answers: {},
        tabSwitchCount: 0,
      },
    });
  } catch (error) {
    console.error("[aptitude/student/tests/[id]/start POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

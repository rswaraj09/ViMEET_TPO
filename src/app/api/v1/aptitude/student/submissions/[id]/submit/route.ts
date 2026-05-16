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

    const submission = await prisma.testSubmission.findUnique({
      where: { id },
      include: {
        test: {
          include: { questions: true },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    if (submission.studentId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (submission.status !== "IN_PROGRESS") {
      return NextResponse.json({ message: "Submission is not in progress" }, { status: 400 });
    }

    const body = await request.json();
    const answers: Record<string, string> = body.answers ?? {};
    const tabSwitchCount: number = body.tabSwitchCount ?? 0;

    let autoScore = 0;
    for (const question of submission.test.questions) {
      if (answers[String(question.id)] === question.correctOption) {
        autoScore += question.marks;
      }
    }

    const updated = await prisma.testSubmission.update({
      where: { id },
      data: {
        answers,
        tabSwitchCount,
        autoScore,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      submission: {
        id: updated.id,
        autoScore: updated.autoScore,
        totalMarks: submission.test.totalMarks,
        submittedAt: updated.submittedAt,
        status: "SUBMITTED",
      },
    });
  } catch (error) {
    console.error("[aptitude/student/submissions/[id]/submit POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

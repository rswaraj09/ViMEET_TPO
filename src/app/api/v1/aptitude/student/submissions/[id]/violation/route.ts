import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

const MAX_VIOLATIONS = 3;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "STUDENT") return forbidden();

  const { id } = await params;

  try {
    const submission = await prisma.testSubmission.findUnique({
      where: { id },
      select: { id: true, studentId: true, status: true, violations: true, testId: true },
    });

    if (!submission) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }
    if (submission.studentId !== user.id) return forbidden();
    if (submission.status !== "IN_PROGRESS") {
      return NextResponse.json({ message: "Submission is not in progress" }, { status: 400 });
    }

    const newViolations = submission.violations + 1;
    const shouldDisqualify = newViolations >= MAX_VIOLATIONS;

    const updated = await prisma.testSubmission.update({
      where: { id },
      data: {
        violations: newViolations,
        ...(shouldDisqualify && {
          status: "DISQUALIFIED",
          submittedAt: new Date(),
        }),
      },
    });

    return NextResponse.json({
      violations: updated.violations,
      disqualified: shouldDisqualify,
      maxViolations: MAX_VIOLATIONS,
    });
  } catch (error) {
    console.error("[violation POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

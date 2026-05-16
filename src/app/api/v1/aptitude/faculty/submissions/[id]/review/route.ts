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

  try {
    const submission = await prisma.testSubmission.findUnique({
      where: { id },
      include: { test: { select: { createdById: true, totalMarks: true } } },
    });

    if (!submission) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (submission.status !== "SUBMITTED") {
      return NextResponse.json({ message: "Submission is not in SUBMITTED state" }, { status: 409 });
    }
    // Only the test creator can review
    if (submission.test.createdById !== user.id) return forbidden();

    const { finalScore, facultyRemarks } = await request.json() as {
      finalScore: number;
      facultyRemarks?: string;
    };

    if (typeof finalScore !== "number" || finalScore < 0) {
      return NextResponse.json({ message: "Invalid finalScore" }, { status: 400 });
    }
    if (finalScore > submission.test.totalMarks) {
      return NextResponse.json(
        { message: `finalScore cannot exceed totalMarks (${submission.test.totalMarks})` },
        { status: 400 }
      );
    }

    const updated = await prisma.testSubmission.update({
      where: { id },
      data: {
        finalScore,
        facultyRemarks: facultyRemarks ?? null,
        status: "REVIEWED",
        reviewedById: user.id,
        reviewedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true, fullName: true, emailId: true,
            studentId: true, department: true, academicYear: true,
          },
        },
      },
    });

    return NextResponse.json({ submission: updated });
  } catch (error) {
    console.error("[aptitude/faculty/submissions/review POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

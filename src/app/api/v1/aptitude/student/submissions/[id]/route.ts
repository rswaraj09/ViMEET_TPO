import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(
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
          select: { title: true, totalMarks: true, minimumMarks: true },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ message: "Submission not found" }, { status: 404 });
    }

    if (submission.studentId !== user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (submission.status === "IN_PROGRESS") {
      return NextResponse.json(
        { message: "Results are not available while the test is in progress" },
        { status: 400 }
      );
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("[aptitude/student/submissions/[id] GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

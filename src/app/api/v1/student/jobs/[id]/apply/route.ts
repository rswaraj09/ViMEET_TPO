import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "STUDENT" && user.role !== "ALUMNI") return forbidden();

  const { id } = await params;

  try {
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job || job.status !== "OPEN") {
      return NextResponse.json({ message: "Job not found or not open" }, { status: 400 });
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { resumeUrl: true },
    });

    if (!userRecord?.resumeUrl) {
      return NextResponse.json(
        { message: "Upload a resume before applying" },
        { status: 400 }
      );
    }

    const existing = await prisma.jobApplication.findUnique({
      where: { jobId_studentId: { jobId: id, studentId: user.id } },
    });

    if (existing) {
      return NextResponse.json({ message: "Already applied" }, { status: 409 });
    }

    const application = await prisma.jobApplication.create({
      data: { jobId: id, studentId: user.id, status: "APPLIED" },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("[student/jobs/[id]/apply POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

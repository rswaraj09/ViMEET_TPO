import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "STUDENT" && user.role !== "ALUMNI") return forbidden();

  const { id } = await params;

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { _count: { select: { applications: true } } },
    });

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    const eligible =
      job.eligibleDepartments.length === 0 ||
      (user.department != null && job.eligibleDepartments.includes(user.department as never)) ||
      job.eligibleYears.length === 0 ||
      (job.minCgpa == null);

    // Full eligibility check
    const departmentOk =
      job.eligibleDepartments.length === 0 ||
      (user.department != null && job.eligibleDepartments.includes(user.department as never));

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { resumeUrl: true, academicYear: true, avgCgpa: true },
    });

    const yearOk =
      job.eligibleYears.length === 0 ||
      (userRecord?.academicYear != null && job.eligibleYears.includes(userRecord.academicYear));

    const cgpaOk =
      job.minCgpa == null ||
      (userRecord?.avgCgpa != null && userRecord.avgCgpa >= job.minCgpa);

    const isEligible = departmentOk && yearOk && cgpaOk;

    const hasResume = !!userRecord?.resumeUrl;

    const myApplicationRaw = await prisma.jobApplication.findUnique({
      where: { jobId_studentId: { jobId: id, studentId: user.id } },
    });

    const myApplication = myApplicationRaw
      ? {
          id: myApplicationRaw.id,
          status: myApplicationRaw.status,
          appliedAt: myApplicationRaw.appliedAt,
          updatedAt: myApplicationRaw.updatedAt,
        }
      : null;

    return NextResponse.json({ job, eligible: isEligible, hasResume, myApplication });
  } catch (error) {
    console.error("[student/jobs/[id] GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

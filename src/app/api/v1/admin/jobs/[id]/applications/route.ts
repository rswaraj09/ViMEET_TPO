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

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const items = await prisma.jobApplication.findMany({
      where: {
        jobId: id,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            emailId: true,
            studentId: true,
            department: true,
            academicYear: true,
            avgCgpa: true,
            resumeUrl: true,
            profilePic: true,
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[admin/jobs/applications GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

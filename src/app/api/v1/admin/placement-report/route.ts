import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const applications = await prisma.jobApplication.findMany({
      where: { status: "SELECTED" },
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
          },
        },
        job: {
          select: {
            id: true,
            companyName: true,
            jobTitle: true,
            package: true,
            jobType: true,
            location: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      items: applications,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[admin/placement-report]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

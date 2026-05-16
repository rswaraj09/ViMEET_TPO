import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const { status } = await request.json() as {
    status: "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "SELECTED" | "REJECTED";
  };

  const valid = ["APPLIED", "SHORTLISTED", "INTERVIEW", "SELECTED", "REJECTED"];
  if (!valid.includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  try {
    const application = await prisma.jobApplication.update({
      where: { id },
      data: { status },
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
    });
    return NextResponse.json({ application });
  } catch (error) {
    console.error("[admin/applications/status PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

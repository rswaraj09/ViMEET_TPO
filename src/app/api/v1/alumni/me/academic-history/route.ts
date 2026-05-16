import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ALUMNI") return forbidden();

  try {
    const result = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        fullName: true,
        legalName: true,
        emailId: true,
        contactNo: true,
        studentId: true,
        department: true,
        academicYear: true,
        skills: true,
        socialProfile: true,
        profilePic: true,
        resumeUrl: true,
        avgCgpa: true,
        marks: true,
        internships: { orderBy: { createdAt: "desc" } },
        achievements: { orderBy: { createdAt: "desc" } },
        projects: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!result) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { marks, internships, achievements, projects, ...userFields } = result;

    return NextResponse.json({ user: userFields, marks, internships, achievements, projects });
  } catch (error) {
    console.error("[alumni/me/academic-history GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

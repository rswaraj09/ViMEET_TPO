import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  const { id } = await params;
  const userId = Number(id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    const student = await prisma.user.findUnique({
      where: { id: userId, role: { in: ["STUDENT", "ALUMNI"] } },
      select: {
        id: true,
        fullName: true,
        legalName: true,
        emailId: true,
        contactNo: true,
        parentsContactNo: true,
        studentId: true,
        department: true,
        academicYear: true,
        avgCgpa: true,
        role: true,
        profilePic: true,
        resumeUrl: true,
        skills: true,
        socialProfile: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        alumniProfile: {
          select: {
            currentOrg: true, currentRole: true,
            package: true, graduationYear: true, placedBy: true,
          },
        },
        marks: true,
        internships: { orderBy: { createdAt: "desc" } },
        achievements: { orderBy: { createdAt: "desc" } },
        certificates: { orderBy: { createdAt: "desc" } },
        verificationRequests: {
          where: { status: "PENDING" },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    // Enforce department scope
    if (student.department !== user.department) return forbidden();

    const { marks, internships, achievements, certificates, verificationRequests, ...userFields } = student;

    return NextResponse.json({
      user: userFields,
      marks: marks ?? null,
      internships,
      achievements,
      certificates,
      pendingVerifications: verificationRequests,
    });
  } catch (error) {
    console.error("[faculty/students/[id] GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

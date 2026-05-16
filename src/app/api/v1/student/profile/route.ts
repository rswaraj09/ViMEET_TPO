import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

const profileSelect = {
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
  skills: true,
  socialProfile: true,
  profilePic: true,
  resumeUrl: true,
  role: true,
  isHOD: true,
  isVerified: true,
  isActive: true,
  ambassadorAssignments: {
    select: {
      id: true,
      roleName: true,
      servedAcademicYear: true,
      createdAt: true,
    },
  },
} as const;

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: profileSelect,
    });
    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error("[student/profile GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  try {
    const body = await request.json();
    const {
      fullName,
      legalName,
      contactNo,
      parentsContactNo,
      studentId,
      department,
      academicYear,
      skills,
      socialProfile,
    } = body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(legalName !== undefined && { legalName }),
        ...(contactNo !== undefined && { contactNo }),
        ...(parentsContactNo !== undefined && { parentsContactNo }),
        ...(studentId !== undefined && { studentId }),
        ...(department !== undefined && { department }),
        ...(academicYear !== undefined && { academicYear }),
        ...(skills !== undefined && { skills }),
        ...(socialProfile !== undefined && { socialProfile }),
      },
      select: profileSelect,
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("[student/profile PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

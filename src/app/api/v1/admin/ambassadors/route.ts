import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const items = await prisma.ambassadorAssignment.findMany({
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            emailId: true,
            studentId: true,
            department: true,
            academicYear: true,
            profilePic: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[admin/ambassadors GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const { studentId, roleName, servedAcademicYear } = await request.json() as {
      studentId: number;
      roleName: string;
      servedAcademicYear: string;
    };

    const assignment = await prisma.ambassadorAssignment.create({
      data: { studentId, roleName, servedAcademicYear },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            emailId: true,
            studentId: true,
            department: true,
            academicYear: true,
            profilePic: true,
          },
        },
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("[admin/ambassadors POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  const dept = (user.department ?? undefined) as never;

  try {
    const [
      totalStudents,
      profileAndMarks,
      internships,
      achievements,
      certificates,
      upcomingEvents,
    ] = await Promise.all([
      prisma.user.count({
        where: { role: "STUDENT", isVerified: true, isActive: true, department: dept },
      }),
      prisma.verificationRequest.count({
        where: {
          status: "PENDING",
          entityType: { in: ["PROFILE", "MARKS"] },
          student: { department: dept },
        },
      }),
      prisma.internship.count({
        where: { isVerified: false, student: { department: dept, role: "STUDENT" } },
      }),
      prisma.achievement.count({
        where: { isVerified: false, student: { department: dept, role: "STUDENT" } },
      }),
      prisma.certificate.count({
        where: { isVerified: false, student: { department: dept, role: "STUDENT" } },
      }),
      prisma.event.count({
        where: { status: { in: ["UPCOMING", "ONGOING"] } },
      }),
    ]);

    return NextResponse.json({
      dept: user.department,
      pending: {
        profileAndMarks,
        internships,
        achievements,
        certificates,
        total: profileAndMarks + internships + achievements + certificates,
      },
      totalStudents,
      upcomingEvents,
    });
  } catch (error) {
    console.error("[faculty/stats GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

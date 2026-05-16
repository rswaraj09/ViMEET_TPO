import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const [
      students,
      alumni,
      faculty,
      registrations,
      profileOrMarksVerifications,
      internshipVerifications,
      achievementVerifications,
      deptRaw,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", isVerified: true, isActive: true } }),
      prisma.user.count({ where: { role: "ALUMNI", isVerified: true, isActive: true } }),
      prisma.user.count({ where: { role: "FACULTY", isVerified: true, isActive: true } }),
      prisma.user.count({ where: { isVerified: false, isActive: true } }),
      prisma.verificationRequest.count({
        where: { status: "PENDING", entityType: { in: ["PROFILE", "MARKS"] } },
      }),
      prisma.internship.count({ where: { isVerified: false } }),
      prisma.achievement.count({ where: { isVerified: false } }),
      prisma.user.groupBy({
        by: ["department"],
        where: { role: { in: ["STUDENT", "ALUMNI"] }, isVerified: true },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
    ]);

    return NextResponse.json({
      totals: { students, alumni, faculty },
      pending: {
        registrations,
        profileOrMarksVerifications,
        internshipVerifications,
        achievementVerifications,
      },
      studentsByDepartment: deptRaw.map((r) => ({
        department: r.department,
        count: r._count.id,
      })),
    });
  } catch (error) {
    console.error("[admin/stats]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const [totalStudents, totalFaculty, totalAlumni, pendingApprovals, activeJobs, upcomingEvents] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT", isVerified: true } }),
      prisma.user.count({ where: { role: "FACULTY", isVerified: true } }),
      prisma.user.count({ where: { role: "ALUMNI", isVerified: true } }),
      prisma.user.count({ where: { isVerified: false, isActive: true } }),
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.event.count({ where: { eventDate: { gte: new Date() }, status: "UPCOMING" } }),
    ]);

    return NextResponse.json({
      stats: { totalStudents, totalFaculty, totalAlumni, pendingApprovals, activeJobs, upcomingEvents },
    });
  } catch (error) {
    console.error("[admin/dashboard]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import { Prisma } from "../../../../../../prisma/output/prismaclient";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["ADMIN", "FACULTY"].includes(user.role)) return forbidden();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const department = searchParams.get("department");
  const academicYear = searchParams.get("academicYear");
  const role = searchParams.get("role") ?? "STUDENT";
  const isVerified = searchParams.get("isVerified");
  const isActive = searchParams.get("isActive");
  const minCgpa = searchParams.get("minCgpa");
  const search = searchParams.get("search");
  const pendingEntity = searchParams.get("pendingEntity");

  const isPlaced = searchParams.get("isPlaced");
  const graduationYear = searchParams.get("graduationYear");

  const where: Prisma.UserWhereInput = {
    role: role as never,
    isActive: isActive !== null ? isActive === "true" : true,
    isVerified: isVerified !== null ? isVerified === "true" : true,
  };
  if (department) where.department = department as never;
  if (academicYear) where.academicYear = academicYear as never;
  if (minCgpa) where.avgCgpa = { gte: Number(minCgpa) };

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { emailId: { contains: search, mode: "insensitive" } },
      { studentId: { contains: search, mode: "insensitive" } },
    ];
  }

  if (isPlaced === "true") {
    where.isPlaced = true;
  } else if (isPlaced === "false") {
    where.isPlaced = false;
  }

  if (graduationYear) {
    where.alumniProfile = { graduationYear: Number(graduationYear) };
  }

  if (pendingEntity === "PROFILE_OR_MARKS") {
    where.verificationRequests = {
      some: { status: "PENDING", entityType: { in: ["PROFILE", "MARKS"] } },
    };
  } else if (pendingEntity === "INTERNSHIP") {
    where.internships = { some: { isVerified: false } };
  } else if (pendingEntity === "ACHIEVEMENT") {
    where.achievements = { some: { isVerified: false } };
  }

  try {
    const [total, students] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          legalName: true,
          emailId: true,
          contactNo: true,
          studentId: true,
          department: true,
          academicYear: true,
          avgCgpa: true,
          role: true,
          profilePic: true,
          resumeUrl: true,
          isVerified: true,
          isActive: true,
          isPlaced: true,
          createdAt: true,
          ambassadorAssignments: {
            select: {
              id: true,
              roleName: true,
              servedAcademicYear: true,
              createdAt: true,
            },
          },
        },
        orderBy: { fullName: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      items: students,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[admin/students GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

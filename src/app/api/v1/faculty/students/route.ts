import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import { Prisma } from "../../../../../../prisma/output/prismaclient";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const academicYear = searchParams.get("academicYear");
  const isVerified = searchParams.get("isVerified");
  const isActive = searchParams.get("isActive");
  const minCgpa = searchParams.get("minCgpa");
  const search = searchParams.get("search");

  const where: Prisma.UserWhereInput = {
    role: "STUDENT",
    department: (user.department ?? undefined) as never,
  };

  if (isVerified !== null) where.isVerified = isVerified === "true";
  if (isActive !== null) where.isActive = isActive === "true";
  if (academicYear) where.academicYear = academicYear as never;
  if (minCgpa) where.avgCgpa = { gte: Number(minCgpa) };

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { emailId: { contains: search, mode: "insensitive" } },
      { studentId: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [total, items] = await Promise.all([
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
          createdAt: true,
        },
        orderBy: { fullName: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[faculty/students GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

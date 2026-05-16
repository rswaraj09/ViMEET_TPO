import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import { Prisma } from "../../../../../../prisma/output/prismaclient";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const status = searchParams.get("status");
  const jobType = searchParams.get("jobType");
  const search = searchParams.get("search");

  const where: Prisma.JobWhereInput = {};
  if (status) where.status = status as never;
  if (jobType) where.jobType = jobType as never;
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { jobTitle: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [total, items] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        include: { _count: { select: { applications: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[admin/jobs GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const body = await request.json();
    const {
      companyName, jobTitle, description, package: pkg, location, locationType,
      jobType, eligibleDepartments, eligibleYears, minCgpa, deadline,
      rounds, openings, bondDetails, additionalNotes,
    } = body;

    const job = await prisma.job.create({
      data: {
        companyName,
        jobTitle,
        description,
        package: pkg,
        location,
        locationType,
        jobType,
        eligibleDepartments: eligibleDepartments ?? [],
        eligibleYears: eligibleYears ?? [],
        minCgpa: minCgpa ?? null,
        deadline: new Date(deadline),
        rounds: rounds ?? [],
        openings: openings ?? null,
        bondDetails: bondDetails ?? null,
        additionalNotes: additionalNotes ?? null,
        createdById: user.id,
      },
      include: { _count: { select: { applications: true } } },
    });

    const eligibleCount = await prisma.user.count({
      where: {
        role: { in: ["STUDENT", "ALUMNI"] },
        isVerified: true,
        isActive: true,
        ...(eligibleDepartments?.length ? { department: { in: eligibleDepartments } } : {}),
        ...(eligibleYears?.length ? { academicYear: { in: eligibleYears } } : {}),
        ...(minCgpa ? { avgCgpa: { gte: minCgpa } } : {}),
      },
    });

    return NextResponse.json({ job, eligibleCount }, { status: 201 });
  } catch (error) {
    console.error("[admin/jobs POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

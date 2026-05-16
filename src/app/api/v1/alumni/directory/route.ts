import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.max(1, Number(searchParams.get("limit") ?? "20"));
  const department = searchParams.get("department") ?? undefined;
  const graduationYear = searchParams.get("graduationYear")
    ? Number(searchParams.get("graduationYear"))
    : undefined;
  const currentOrg = searchParams.get("currentOrg") ?? undefined;
  const track = searchParams.get("track") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  try {
    const where: Record<string, unknown> = { role: "ALUMNI" };

    if (department) {
      where.department = department;
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { emailId: { contains: search, mode: "insensitive" } },
      ];
    }

    const alumniProfileFilter: Record<string, unknown> = {};

    if (graduationYear !== undefined) {
      alumniProfileFilter.graduationYear = graduationYear;
    }

    if (currentOrg) {
      alumniProfileFilter.currentOrg = { contains: currentOrg, mode: "insensitive" };
    }

    if (track === "WORKING") {
      alumniProfileFilter.currentOrg = { not: null };
    } else if (track === "HIGHER_STUDIES") {
      alumniProfileFilter.higherStudies = { isNot: null };
    }

    if (Object.keys(alumniProfileFilter).length > 0) {
      where.alumniProfile = alumniProfileFilter;
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          alumniProfile: { include: { higherStudies: true } },
        },
        orderBy: { fullName: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ items, page, limit, total, totalPages });
  } catch (error) {
    console.error("[alumni/directory GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

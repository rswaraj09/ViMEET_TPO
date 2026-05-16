import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const search = searchParams.get("search");

  const where = {
    role: "ALUMNI" as const,
    department: (user.department ?? undefined) as never,
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { emailId: { contains: search, mode: "insensitive" as const } },
            { studentId: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  try {
    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          emailId: true,
          studentId: true,
          department: true,
          profilePic: true,
          resumeUrl: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
          alumniProfile: {
            select: {
              currentOrg: true, currentRole: true,
              package: true, graduationYear: true,
            },
          },
        },
        orderBy: { fullName: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("[faculty/alumni GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.max(1, Number(searchParams.get("limit") ?? "20"));
  const postType = searchParams.get("postType") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  try {
    const where = {
      ...(postType ? { postType: postType as never } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { body: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.alumniPost.findMany({
        where,
        include: {
          alumni: {
            select: {
              id: true,
              fullName: true,
              profilePic: true,
              department: true,
              alumniProfile: {
                select: { currentOrg: true, currentRole: true, graduationYear: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.alumniPost.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ items, page, limit, total, totalPages });
  } catch (error) {
    console.error("[alumni/feed GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

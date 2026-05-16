import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const tests = await prisma.aptitudeTest.findMany({
      where: { status: { in: ["PUBLISHED", "ARCHIVED"] } },
      include: {
        _count: { select: { questions: true, submissions: true } },
        createdBy: { select: { fullName: true, department: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tests });
  } catch (error) {
    console.error("[admin/aptitude/results GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

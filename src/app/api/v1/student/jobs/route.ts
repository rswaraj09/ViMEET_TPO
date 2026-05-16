import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "STUDENT") return forbidden();

  try {
    const student = await prisma.user.findUnique({ where: { id: user.id }, select: { department: true } });
    const jobs = await prisma.job.findMany({
      where: {
        status: "OPEN",
        OR: [
          { eligibleDepartments: { isEmpty: true } },
          { eligibleDepartments: { has: (student?.department ?? undefined) as never } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("[student/jobs]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

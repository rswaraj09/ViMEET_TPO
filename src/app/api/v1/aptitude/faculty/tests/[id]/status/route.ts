import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  const { id } = await params;
  const testId = Number(id);
  if (Number.isNaN(testId)) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  try {
    const existing = await prisma.aptitudeTest.findFirst({
      where: { id: testId, createdById: user.id },
      include: { _count: { select: { questions: true } } },
    });
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const { status } = await request.json() as { status: string };
    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    if (status === "PUBLISHED" && existing._count.questions === 0) {
      return NextResponse.json({ message: "Cannot publish a test with no questions" }, { status: 400 });
    }

    const test = await prisma.aptitudeTest.update({
      where: { id: testId },
      data: {
        status: status as never,
        isActive: status === "PUBLISHED",
      },
      include: { _count: { select: { questions: true, submissions: true } } },
    });

    return NextResponse.json({ test });
  } catch (error) {
    console.error("[aptitude/faculty/tests/[id]/status POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

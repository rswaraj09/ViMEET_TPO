import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

const includeAll = {
  questions: { orderBy: { id: "asc" as const } },
  sections: { orderBy: { order: "asc" as const } },
  _count: { select: { questions: true, submissions: true } },
};

async function resolveTest(id: string, facultyId: number) {
  const testId = Number(id);
  if (Number.isNaN(testId)) return null;
  return prisma.aptitudeTest.findFirst({
    where: { id: testId, createdById: facultyId },
    include: includeAll,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  const { id } = await params;
  const test = await resolveTest(id, user.id);
  if (!test) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json({ test });
}

export async function PATCH(
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
    });
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });
    if (existing.status !== "DRAFT") {
      return NextResponse.json({ message: "Only DRAFT tests can be edited" }, { status: 409 });
    }

    const body = await request.json() as {
      title?: string;
      description?: string;
      rules?: string[];
      totalTime?: number;
      minimumMarks?: number;
      allowedAttempts?: number;
      tabSwitchLimit?: number;
      category?: string;
      isHomework?: boolean;
      department?: string | null;
      eligibleYears?: string[];
      sections?: Array<{ name: string; description?: string; order: number; timeLimit?: number | null }>;
      questions?: Array<{
        sectionId?: string | null;
        question: string;
        option1: string;
        option2?: string | null;
        option3?: string | null;
        option4?: string | null;
        correctOption: string;
        marks: number;
      }>;
    };

    const { questions, sections, ...meta } = body;

    const updates: Record<string, unknown> = {};
    if (meta.title !== undefined) updates.title = meta.title;
    if (meta.description !== undefined) updates.description = meta.description;
    if (meta.rules !== undefined) updates.rules = meta.rules;
    if (meta.totalTime !== undefined) updates.totalTime = meta.totalTime;
    if (meta.minimumMarks !== undefined) updates.minimumMarks = meta.minimumMarks;
    if (meta.allowedAttempts !== undefined) updates.allowedAttempts = meta.allowedAttempts;
    if (meta.tabSwitchLimit !== undefined) updates.tabSwitchLimit = meta.tabSwitchLimit;
    if (meta.category !== undefined) updates.category = meta.category;
    if (meta.isHomework !== undefined) updates.isHomework = meta.isHomework;
    if ("department" in meta) updates.department = meta.department ?? null;
    if (meta.eligibleYears !== undefined) updates.eligibleYears = meta.eligibleYears;

    // Replace sections if provided
    let newSectionIds: string[] = [];
    if (sections !== undefined) {
      await prisma.aptitudeSection.deleteMany({ where: { testId } });
      const created = await Promise.all(
        sections.map((s) =>
          prisma.aptitudeSection.create({
            data: {
              testId,
              name: s.name,
              description: s.description ?? null,
              order: s.order,
              timeLimit: s.timeLimit ?? null,
            },
          })
        )
      );
      newSectionIds = created.map((s) => s.id);
    }

    // Replace questions if provided
    if (questions !== undefined) {
      updates.totalMarks = questions.reduce((s, q) => s + q.marks, 0);
      await prisma.question.deleteMany({ where: { testId } });
      await prisma.question.createMany({
        data: questions.map((q) => {
          const secId = q.sectionId && q.sectionId.startsWith("section:")
            ? newSectionIds[Number(q.sectionId.replace("section:", ""))]
            : (q.sectionId ?? null);
          return {
            testId,
            sectionId: secId || null,
            question: q.question,
            option1: q.option1,
            option2: q.option2 ?? null,
            option3: q.option3 ?? null,
            option4: q.option4 ?? null,
            correctOption: q.correctOption,
            marks: q.marks,
          };
        }),
      });
    }

    const test = await prisma.aptitudeTest.update({
      where: { id: testId },
      data: updates as never,
      include: includeAll,
    });

    return NextResponse.json({ test });
  } catch (error) {
    console.error("[aptitude/faculty/tests/[id] PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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
    });
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await prisma.aptitudeTest.delete({ where: { id: testId } });
    return NextResponse.json({ message: "Test deleted" });
  } catch (error) {
    console.error("[aptitude/faculty/tests/[id] DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

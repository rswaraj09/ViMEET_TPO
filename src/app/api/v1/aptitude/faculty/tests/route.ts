import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  try {
    const items = await prisma.aptitudeTest.findMany({
      where: { createdById: user.id },
      include: {
        _count: { select: { questions: true, submissions: true } },
        sections: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[aptitude/faculty/tests GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  try {
    const body = await request.json() as {
      title: string;
      description: string;
      rules: string[];
      totalTime: number;
      minimumMarks: number;
      allowedAttempts: number;
      tabSwitchLimit: number;
      category: string;
      isHomework: boolean;
      department: string | null;
      eligibleYears: string[];
      sections?: Array<{ name: string; description?: string; order: number; timeLimit?: number | null }>;
      questions: Array<{
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

    const {
      title, description, rules, totalTime, minimumMarks,
      allowedAttempts, tabSwitchLimit, category, isHomework,
      department, eligibleYears, questions, sections = [],
    } = body;

    if (!title || !description || !category) {
      return NextResponse.json({ message: "title, description, and category are required" }, { status: 400 });
    }

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    // Create test with sections first, then questions
    const test = await prisma.aptitudeTest.create({
      data: {
        title,
        description,
        rules: rules ?? [],
        totalTime: totalTime ?? 0,
        totalMarks,
        minimumMarks: minimumMarks ?? 0,
        allowedAttempts: allowedAttempts ?? 1,
        tabSwitchLimit: tabSwitchLimit ?? 3,
        category: category as never,
        isHomework: isHomework ?? false,
        department: department ? (department as never) : null,
        eligibleYears: (eligibleYears ?? []) as never,
        createdById: user.id,
        sections: {
          create: sections.map((s) => ({
            name: s.name,
            description: s.description ?? null,
            order: s.order,
            timeLimit: s.timeLimit ?? null,
          })),
        },
      },
      include: {
        sections: { orderBy: { order: "asc" } },
        _count: { select: { questions: true, submissions: true } },
      },
    });

    // Map section names → created section ids for question linking
    const sectionIdMap: Record<number, string> = {};
    sections.forEach((s, idx) => {
      sectionIdMap[idx] = test.sections[idx]?.id ?? "";
    });

    // Create questions, linking to sections by index if sectionId is "section:N" pattern
    if (questions.length > 0) {
      await prisma.question.createMany({
        data: questions.map((q) => {
          const secId = q.sectionId && q.sectionId.startsWith("section:")
            ? sectionIdMap[Number(q.sectionId.replace("section:", ""))]
            : (q.sectionId ?? null);
          return {
            testId: test.id,
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

    const full = await prisma.aptitudeTest.findUnique({
      where: { id: test.id },
      include: {
        questions: true,
        sections: { orderBy: { order: "asc" } },
        _count: { select: { questions: true, submissions: true } },
      },
    });

    return NextResponse.json({ test: full }, { status: 201 });
  } catch (error) {
    console.error("[aptitude/faculty/tests POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

function round2(v: number | null | undefined): number | null {
  return v != null ? Math.round(v * 100) / 100 : null;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    // ── Placement ────────────────────────────────────────────────────────
    const [totalStudents, placedCount, allByDept, placedByDept, selectedApps] =
      await Promise.all([
        prisma.user.count({
          where: { role: { in: ["STUDENT", "ALUMNI"] }, isVerified: true },
        }),
        prisma.user.count({
          where: { role: { in: ["STUDENT", "ALUMNI"] }, isVerified: true, isPlaced: true },
        }),
        prisma.user.groupBy({
          by: ["department"],
          where: {
            role: { in: ["STUDENT", "ALUMNI"] },
            isVerified: true,
            department: { not: null },
          },
          _count: { _all: true },
        }),
        prisma.user.groupBy({
          by: ["department"],
          where: {
            role: { in: ["STUDENT", "ALUMNI"] },
            isVerified: true,
            isPlaced: true,
            department: { not: null },
          },
          _count: { _all: true },
        }),
        prisma.jobApplication.findMany({
          where: { status: "SELECTED" },
          select: { job: { select: { companyName: true } } },
        }),
      ]);

    const placedMap = new Map(placedByDept.map((d) => [d.department, d._count._all]));
    const byDepartment = allByDept.map((d) => ({
      department: d.department as string,
      total: d._count._all,
      placed: placedMap.get(d.department) ?? 0,
    }));

    const companyMap = new Map<string, number>();
    for (const app of selectedApps) {
      const name = app.job.companyName;
      companyMap.set(name, (companyMap.get(name) ?? 0) + 1);
    }
    const topCompanies = [...companyMap.entries()]
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── Academics ────────────────────────────────────────────────────────
    const [semAvg, cgpaRaw] = await Promise.all([
      prisma.marks.aggregate({
        _avg: {
          sem1: true, sem2: true, sem3: true, sem4: true,
          sem5: true, sem6: true, sem7: true, sem8: true,
          sscPercentage: true, hscPercentage: true, diplomaPercentage: true,
        },
      }),
      prisma.user.groupBy({
        by: ["department"],
        where: {
          role: { in: ["STUDENT", "ALUMNI"] },
          isVerified: true,
          avgCgpa: { gt: 0 },
          department: { not: null },
        },
        _avg: { avgCgpa: true },
      }),
    ]);

    const semesterAverages = [
      { sem: "Sem 1", avg: round2(semAvg._avg.sem1) },
      { sem: "Sem 2", avg: round2(semAvg._avg.sem2) },
      { sem: "Sem 3", avg: round2(semAvg._avg.sem3) },
      { sem: "Sem 4", avg: round2(semAvg._avg.sem4) },
      { sem: "Sem 5", avg: round2(semAvg._avg.sem5) },
      { sem: "Sem 6", avg: round2(semAvg._avg.sem6) },
      { sem: "Sem 7", avg: round2(semAvg._avg.sem7) },
      { sem: "Sem 8", avg: round2(semAvg._avg.sem8) },
    ].filter((s) => s.avg !== null) as { sem: string; avg: number }[];

    const cgpaByDepartment = cgpaRaw.map((d) => ({
      department: d.department as string,
      avg: round2(d._avg.avgCgpa) ?? 0,
    }));

    // ── Aptitude ─────────────────────────────────────────────────────────
    const tests = await prisma.aptitudeTest.findMany({
      where: { status: { in: ["PUBLISHED", "ARCHIVED"] } },
      select: { id: true, title: true, category: true, minimumMarks: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const aptitudeTests: object[] = [];

    if (tests.length > 0) {
      const submissions = await prisma.testSubmission.findMany({
        where: {
          testId: { in: tests.map((t) => t.id) },
          status: { not: "IN_PROGRESS" },
        },
        select: { testId: true, status: true, finalScore: true, autoScore: true },
      });

      for (const test of tests) {
        const subs = submissions.filter((s) => s.testId === test.id);
        const disqualified = subs.filter((s) => s.status === "DISQUALIFIED").length;
        const completed = subs.filter((s) =>
          ["SUBMITTED", "REVIEWED"].includes(s.status)
        );
        const passed = completed.filter(
          (s) => (s.finalScore ?? s.autoScore ?? 0) >= test.minimumMarks
        ).length;
        const failed = completed.length - passed;
        const scores = completed
          .map((s) => s.finalScore ?? s.autoScore)
          .filter((v): v is number => v !== null);
        const avgScore =
          scores.length
            ? round2(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null;

        aptitudeTests.push({
          id: test.id,
          title: test.title,
          category: test.category,
          submitted: subs.length,
          passed,
          failed,
          disqualified,
          avgScore,
        });
      }
    }

    return NextResponse.json({
      placement: { totalStudents, placedCount, byDepartment, topCompanies },
      academics: {
        semesterAverages,
        cgpaByDepartment,
        preCollegeAvg: {
          ssc: round2(semAvg._avg.sscPercentage),
          hsc: round2(semAvg._avg.hscPercentage),
          diploma: round2(semAvg._avg.diplomaPercentage),
        },
      },
      aptitude: { tests: aptitudeTests },
    });
  } catch (error) {
    console.error("[admin/statistics]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

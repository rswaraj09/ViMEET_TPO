import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

const SEM_FIELDS = ["sem1", "sem2", "sem3", "sem4", "sem5", "sem6", "sem7", "sem8"] as const;

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const allMarks = await prisma.marks.findMany();
  let updated = 0;

  for (const marks of allMarks) {
    const values = SEM_FIELDS.map((f) => marks[f]).filter((v): v is number => v !== null);
    const avgCgpa = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    await prisma.user.update({ where: { id: marks.userId }, data: { avgCgpa } });
    updated++;
  }

  return NextResponse.json({ message: `Recalculated avgCgpa for ${updated} students` });
}

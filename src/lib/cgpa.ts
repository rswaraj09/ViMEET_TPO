import prisma from "@/lib/prisma";

const SEM_FIELDS = ["sem1", "sem2", "sem3", "sem4", "sem5", "sem6", "sem7", "sem8"] as const;

export async function recalculateAvgCgpa(userId: number): Promise<void> {
  const marks = await prisma.marks.findUnique({ where: { userId } });
  if (!marks) return;

  const values = SEM_FIELDS.map((f) => marks[f]).filter((v): v is number => v !== null);
  const avgCgpa = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  await prisma.user.update({ where: { id: userId }, data: { avgCgpa } });
}

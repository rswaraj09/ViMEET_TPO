import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

const SCORE_FIELDS = [
  "sscPercentage",
  "hscPercentage",
  "diplomaPercentage",
  "sem1",
  "sem2",
  "sem3",
  "sem4",
  "sem5",
  "sem6",
  "sem7",
  "sem8",
] as const;

async function getOrCreateMarks(userId: number) {
  let marks = await prisma.marks.findUnique({ where: { userId } });
  if (!marks) {
    marks = await prisma.marks.create({ data: { userId } });
  }
  return marks;
}

async function getPendingVerification(userId: number) {
  return prisma.verificationRequest.findFirst({
    where: { userId, status: "PENDING", entityType: "MARKS" },
    orderBy: { createdAt: "desc" },
  });
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  try {
    const marks = await getOrCreateMarks(user.id);
    const pendingVerification = await getPendingVerification(user.id);
    return NextResponse.json({ marks, pendingVerification });
  } catch (error) {
    console.error("[student/marks GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  try {
    const body = await request.json() as Record<string, number | null>;
    const marks = await getOrCreateMarks(user.id);

    // Compute which score fields actually changed
    const changes: Record<string, { oldValue: unknown; newValue: unknown }> = {};
    for (const field of SCORE_FIELDS) {
      if (!(field in body)) continue;
      const newVal = body[field] ?? null;
      const oldVal = (marks[field] as number | null) ?? null;
      if (newVal !== oldVal) {
        changes[field] = { oldValue: oldVal, newValue: newVal };
      }
    }

    if (Object.keys(changes).length === 0) {
      const pendingVerification = await getPendingVerification(user.id);
      return NextResponse.json({
        marks,
        pendingVerification,
        appliedFields: [],
        pendingFieldCount: 0,
      });
    }

    // If marks not yet verified → apply directly without creating a request
    if (!marks.isVerified) {
      const updateData: Record<string, number | null> = {};
      for (const [field, diff] of Object.entries(changes)) {
        updateData[field] = diff.newValue as number | null;
      }
      const updated = await prisma.marks.update({
        where: { userId: user.id },
        data: updateData,
      });
      return NextResponse.json({
        marks: updated,
        pendingVerification: null,
        appliedFields: Object.keys(changes),
        pendingFieldCount: 0,
      });
    }

    // Verified marks → route changes through VerificationRequest
    // Cancel any existing pending MARKS request first
    await prisma.verificationRequest.updateMany({
      where: { userId: user.id, status: "PENDING", entityType: "MARKS" },
      data: { status: "REJECTED", remarks: "Superseded by new submission" },
    });

    const vr = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        entityType: "MARKS",
        changes: changes as never,
        status: "PENDING",
      },
    });

    const pendingVerification = {
      id: vr.id,
      changes: vr.changes as Record<string, { oldValue: unknown; newValue: unknown }>,
      entityType: vr.entityType,
      entityId: vr.entityId,
      status: vr.status,
      createdAt: vr.createdAt.toISOString(),
    };

    return NextResponse.json({
      marks,
      pendingVerification,
      appliedFields: [],
      pendingFieldCount: Object.keys(changes).length,
    });
  } catch (error) {
    console.error("[student/marks PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

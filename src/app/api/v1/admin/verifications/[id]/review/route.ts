import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const body = await request.json();
  const { status, remarks } = body as { status: string; remarks?: string };

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  try {
    const vr = await prisma.verificationRequest.findUnique({ where: { id } });
    if (!vr) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    if (vr.status !== "PENDING") {
      return NextResponse.json({ message: "Already reviewed" }, { status: 409 });
    }

    if (status === "APPROVED") {
      const changes = vr.changes as Record<
        string,
        { oldValue: unknown; newValue: unknown }
      >;
      const updates: Record<string, unknown> = {};
      for (const [field, diff] of Object.entries(changes)) {
        updates[field] = diff.newValue;
      }

      if (vr.entityType === "PROFILE") {
        await prisma.user.update({ where: { id: vr.userId }, data: updates });
      } else if (vr.entityType === "MARKS") {
        await prisma.marks.upsert({
          where: { userId: vr.userId },
          create: { userId: vr.userId, ...updates },
          update: updates,
        });
      }
    } else if (status === "REJECTED" && vr.entityType === "PROFILE") {
      await prisma.user.delete({ where: { id: vr.userId } });
      return NextResponse.json({ message: "Student account deleted" });
    }

    await prisma.verificationRequest.update({
      where: { id },
      data: {
        status: status as "APPROVED" | "REJECTED",
        reviewedById: user.id,
        remarks: remarks ?? null,
        reviewedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Review submitted" });
  } catch (error) {
    console.error("[admin/verifications/review]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

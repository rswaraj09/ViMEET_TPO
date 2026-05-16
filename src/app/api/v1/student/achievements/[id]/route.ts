import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.achievement.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const body = await request.json() as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.category !== undefined) data.category = body.category;
    if (body.certificateUrl !== undefined) data.certificateUrl = body.certificateUrl;
    if ("achievementDate" in body) {
      data.achievementDate = body.achievementDate ? new Date(body.achievementDate as string) : null;
    }

    const achievement = await prisma.achievement.update({ where: { id }, data: data as never });
    return NextResponse.json({ achievement });
  } catch (error) {
    console.error("[student/achievements/[id] PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  const { id } = await params;

  try {
    const existing = await prisma.achievement.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await prisma.achievement.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("[student/achievements/[id] DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
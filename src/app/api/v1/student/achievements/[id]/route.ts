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

  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if ("title" in body) data.title = body.title;
    if ("description" in body) data.description = body.description;
    if ("category" in body) data.category = body.category;
    if ("certificateUrl" in body) data.certificateUrl = body.certificateUrl;
    if ("achievementDate" in body)
      data.achievementDate = body.achievementDate ? new Date(body.achievementDate) : null;

    const achievement = await prisma.achievement.update({
      where: { id, userId: user.id },
      data,
    });

    return NextResponse.json({ achievement });
  } catch (error) {
    console.error("[student/achievements/:id PATCH]", error);
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

  try {
    const { id } = await params;

    await prisma.achievement.delete({
      where: { id, userId: user.id },
    });

    return NextResponse.json({}, { status: 204 });
  } catch (error) {
    console.error("[student/achievements/:id DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

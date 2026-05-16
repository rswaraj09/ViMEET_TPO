import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  try {
    const items = await prisma.achievement.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[student/achievements GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  try {
    const body = await request.json();
    const { title, description, category, certificateUrl, achievementDate } = body;

    const achievement = await prisma.achievement.create({
      data: {
        userId: user.id,
        title,
        description,
        category,
        certificateUrl,
        achievementDate: achievementDate ? new Date(achievementDate) : undefined,
      },
    });

    return NextResponse.json({ achievement }, { status: 201 });
  } catch (error) {
    console.error("[student/achievements POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

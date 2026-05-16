import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  try {
    const items = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[student/projects GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  try {
    const body = await request.json();
    const {
      title,
      description,
      techStack,
      projectUrl,
      repoUrl,
      startDate,
      endDate,
    } = body;

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        title,
        description,
        techStack: techStack ?? [],
        projectUrl,
        repoUrl,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[student/projects POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

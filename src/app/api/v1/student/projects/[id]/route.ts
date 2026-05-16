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
    const existing = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const body = await request.json() as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.techStack !== undefined) data.techStack = body.techStack;
    if (body.projectUrl !== undefined) data.projectUrl = body.projectUrl;
    if (body.repoUrl !== undefined) data.repoUrl = body.repoUrl;
    if ("startDate" in body) data.startDate = body.startDate ? new Date(body.startDate as string) : null;
    if ("endDate" in body) data.endDate = body.endDate ? new Date(body.endDate as string) : null;

    const project = await prisma.project.update({ where: { id }, data: data as never });
    return NextResponse.json({ project });
  } catch (error) {
    console.error("[student/projects/[id] PATCH]", error);
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
    const existing = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("[student/projects/[id] DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
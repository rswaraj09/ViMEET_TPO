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
    if ("techStack" in body) data.techStack = body.techStack;
    if ("projectUrl" in body) data.projectUrl = body.projectUrl;
    if ("repoUrl" in body) data.repoUrl = body.repoUrl;
    if ("startDate" in body) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if ("endDate" in body) data.endDate = body.endDate ? new Date(body.endDate) : null;

    const project = await prisma.project.update({
      where: { id, userId: user.id },
      data,
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("[student/projects/:id PATCH]", error);
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

    await prisma.project.delete({
      where: { id, userId: user.id },
    });

    return NextResponse.json({}, { status: 204 });
  } catch (error) {
    console.error("[student/projects/:id DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

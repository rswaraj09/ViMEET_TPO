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
    const existing = await prisma.internship.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const body = await request.json() as Record<string, unknown>;
    const data: Record<string, unknown> = {};

    if (body.companyName !== undefined) data.companyName = body.companyName;
    if (body.role !== undefined) data.role = body.role;
    if (body.roleDescription !== undefined) data.roleDescription = body.roleDescription;
    if (body.duration !== undefined) data.duration = body.duration;
    if (body.startDate !== undefined) data.startDate = new Date(body.startDate as string);
    if ("endDate" in body) data.endDate = body.endDate ? new Date(body.endDate as string) : null;
    if (body.certificateUrl !== undefined) data.certificateUrl = body.certificateUrl;

    const internship = await prisma.internship.update({ where: { id }, data: data as never });
    return NextResponse.json({ internship });
  } catch (error) {
    console.error("[student/internships/[id] PATCH]", error);
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
    const existing = await prisma.internship.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 });

    await prisma.internship.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("[student/internships/[id] DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
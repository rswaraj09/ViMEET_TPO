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
    if ("companyName" in body) data.companyName = body.companyName;
    if ("role" in body) data.role = body.role;
    if ("roleDescription" in body) data.roleDescription = body.roleDescription;
    if ("duration" in body) data.duration = body.duration;
    if ("startDate" in body) data.startDate = new Date(body.startDate);
    if ("endDate" in body) data.endDate = body.endDate ? new Date(body.endDate) : null;
    if ("certificateUrl" in body) data.certificateUrl = body.certificateUrl;
    if ("hrName" in body) data.hrName = body.hrName;
    if ("hrEmail" in body) data.hrEmail = body.hrEmail;
    if ("hrPhone" in body) data.hrPhone = body.hrPhone;

    const internship = await prisma.internship.update({
      where: { id, userId: user.id },
      data,
    });

    return NextResponse.json({ internship });
  } catch (error) {
    console.error("[student/internships/:id PATCH]", error);
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

    await prisma.internship.delete({
      where: { id, userId: user.id },
    });

    return NextResponse.json({}, { status: 204 });
  } catch (error) {
    console.error("[student/internships/:id DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

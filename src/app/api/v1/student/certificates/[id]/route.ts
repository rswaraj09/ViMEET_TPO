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
    if ("issuingOrg" in body) data.issuingOrg = body.issuingOrg;
    if ("issueDate" in body) data.issueDate = body.issueDate ? new Date(body.issueDate) : null;
    if ("expiryDate" in body) data.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
    if ("credentialId" in body) data.credentialId = body.credentialId;
    if ("credentialUrl" in body) data.credentialUrl = body.credentialUrl;
    if ("certificateUrl" in body) data.certificateUrl = body.certificateUrl;

    const certificate = await prisma.certificate.update({
      where: { id, userId: user.id },
      data,
    });

    return NextResponse.json({ certificate });
  } catch (error) {
    console.error("[student/certificates/:id PATCH]", error);
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

    await prisma.certificate.delete({
      where: { id, userId: user.id },
    });

    return NextResponse.json({}, { status: 204 });
  } catch (error) {
    console.error("[student/certificates/:id DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

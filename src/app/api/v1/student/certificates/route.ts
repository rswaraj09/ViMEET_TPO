import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  try {
    const items = await prisma.certificate.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[student/certificates GET]", error);
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
      issuingOrg,
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
      certificateUrl,
    } = body;

    const certificate = await prisma.certificate.create({
      data: {
        userId: user.id,
        title,
        issuingOrg,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        credentialId,
        credentialUrl,
        certificateUrl,
      },
    });

    return NextResponse.json({ certificate }, { status: 201 });
  } catch (error) {
    console.error("[student/certificates POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

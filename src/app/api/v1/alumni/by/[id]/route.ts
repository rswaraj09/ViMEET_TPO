import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized } from "@/lib/apiAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const result = await prisma.user.findUnique({
      where: { id: Number(id), role: "ALUMNI" },
      include: {
        alumniProfile: { include: { pastOrgs: true, higherStudies: true } },
      },
    });

    if (!result) {
      return NextResponse.json({ message: "Alumni not found" }, { status: 404 });
    }

    return NextResponse.json({ user: result });
  } catch (error) {
    console.error("[alumni/by/[id] GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ALUMNI") return forbidden();

  const { id } = await params;

  try {
    const profile = await prisma.alumniProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ message: "Alumni profile not found" }, { status: 404 });
    }

    await prisma.pastOrg.delete({
      where: { id: Number(id), alumniId: profile.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[alumni/me/past-orgs/[id] DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

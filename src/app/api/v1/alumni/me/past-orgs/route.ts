import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ALUMNI") return forbidden();

  try {
    const body = await request.json();
    const { companyName, role, joiningDate, leavingDate } = body;

    const profile = await prisma.alumniProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    const pastOrg = await prisma.pastOrg.create({
      data: {
        alumniId: profile.id,
        companyName,
        role,
        joiningDate: new Date(joiningDate),
        leavingDate: leavingDate ? new Date(leavingDate) : null,
      },
    });

    return NextResponse.json({ pastOrg }, { status: 201 });
  } catch (error) {
    console.error("[alumni/me/past-orgs POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

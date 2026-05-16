import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function PUT(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ALUMNI") return forbidden();

  try {
    const body = await request.json();
    const { collegeName, branch, location, joiningDate, leavingDate } = body;

    const profile = await prisma.alumniProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    const higherStudies = await prisma.higherStudies.upsert({
      where: { alumniId: profile.id },
      create: {
        alumniId: profile.id,
        collegeName,
        branch,
        location,
        joiningDate: new Date(joiningDate),
        leavingDate: leavingDate ? new Date(leavingDate) : null,
      },
      update: {
        collegeName,
        branch,
        location,
        joiningDate: new Date(joiningDate),
        leavingDate: leavingDate ? new Date(leavingDate) : null,
      },
    });

    return NextResponse.json({ higherStudies });
  } catch (error) {
    console.error("[alumni/me/higher-studies PUT]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ALUMNI") return forbidden();

  try {
    const profile = await prisma.alumniProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ message: "Alumni profile not found" }, { status: 404 });
    }

    await prisma.higherStudies.delete({ where: { alumniId: profile.id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[alumni/me/higher-studies DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

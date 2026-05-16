import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ALUMNI") return forbidden();

  try {
    const result = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        fullName: true,
        emailId: true,
        contactNo: true,
        profilePic: true,
        department: true,
        studentId: true,
        skills: true,
        socialProfile: true,
        alumniProfile: { include: { pastOrgs: true, higherStudies: true } },
      },
    });

    return NextResponse.json({ user: result });
  } catch (error) {
    console.error("[alumni/me GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ALUMNI") return forbidden();

  try {
    const body = await request.json();

    const {
      fullName,
      contactNo,
      skills,
      socialProfile,
      currentOrg,
      currentRole,
      package: pkg,
      graduationYear,
      placedBy,
    } = body;

    const userFields: Record<string, unknown> = {};
    if (fullName !== undefined) userFields.fullName = fullName;
    if (contactNo !== undefined) userFields.contactNo = contactNo;
    if (skills !== undefined) userFields.skills = skills;
    if (socialProfile !== undefined) userFields.socialProfile = socialProfile;

    if (Object.keys(userFields).length > 0) {
      await prisma.user.update({ where: { id: user.id }, data: userFields });
    }

    const alumniFields: Record<string, unknown> = {};
    if (currentOrg !== undefined) alumniFields.currentOrg = currentOrg;
    if (currentRole !== undefined) alumniFields.currentRole = currentRole;
    if (pkg !== undefined) alumniFields.package = pkg;
    if (graduationYear !== undefined) alumniFields.graduationYear = graduationYear;
    if (placedBy !== undefined) alumniFields.placedBy = placedBy;

    const profile = await prisma.alumniProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...alumniFields },
      update: { ...alumniFields },
      include: { pastOrgs: true, higherStudies: true },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[alumni/me PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

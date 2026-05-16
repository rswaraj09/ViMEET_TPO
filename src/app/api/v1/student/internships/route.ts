import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  try {
    const items = await prisma.internship.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[student/internships GET]", error);
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
      companyName,
      role,
      roleDescription,
      duration,
      startDate,
      endDate,
      certificateUrl,
      hrName,
      hrEmail,
      hrPhone,
    } = body;

    const internship = await prisma.internship.create({
      data: {
        userId: user.id,
        companyName,
        role,
        roleDescription,
        duration,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        certificateUrl,
        hrName,
        hrEmail,
        hrPhone,
      },
    });

    return NextResponse.json({ internship }, { status: 201 });
  } catch (error) {
    console.error("[student/internships POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

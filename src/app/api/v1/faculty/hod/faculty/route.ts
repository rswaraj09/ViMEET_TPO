import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY" || !user.isHOD) return forbidden();

  try {
    const items = await prisma.user.findMany({
      where: { role: "FACULTY", department: (user.department ?? undefined) as never },
      select: {
        id: true,
        fullName: true,
        emailId: true,
        contactNo: true,
        department: true,
        isHOD: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[faculty/hod/faculty GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

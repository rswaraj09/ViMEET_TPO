import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const items = await prisma.user.findMany({
      where: { isVerified: false, isActive: true },
      select: {
        id: true,
        fullName: true,
        emailId: true,
        contactNo: true,
        studentId: true,
        department: true,
        academicYear: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[admin/registrations GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const { isVerified } = await request.json() as { isVerified: boolean };

  try {
    const internship = await prisma.internship.findUnique({ where: { id } });
    if (!internship) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    await prisma.internship.update({ where: { id }, data: { isVerified } });
    return NextResponse.json({ message: "Review submitted" });
  } catch (error) {
    console.error("[admin/internships/review]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

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
  const userId = Number(id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  const { endsOn } = await request.json() as { endsOn: string | null };

  const onInternshipUntil = endsOn ? new Date(endsOn) : null;

  if (onInternshipUntil !== null && isNaN(onInternshipUntil.getTime())) {
    return NextResponse.json({ message: "Invalid date" }, { status: 400 });
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { onInternshipUntil },
    });
    return NextResponse.json({
      message: onInternshipUntil ? "Internship set" : "Internship cleared",
    });
  } catch (error) {
    console.error("[admin/students/internship]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

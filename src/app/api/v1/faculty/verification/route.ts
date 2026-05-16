import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  try {
    const requests = await prisma.verificationRequest.findMany({
      where: {
        status: "PENDING",
        student: { department: (user.department ?? undefined) as never },
      },
      include: {
        student: { select: { id: true, fullName: true, studentId: true, department: true, profilePic: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("[faculty/verification GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  try {
    const { requestId, action, comment } = await request.json();
    const updated = await prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
        reviewedById: user.id,
        remarks: comment,
        reviewedAt: new Date(),
      },
    });
    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("[faculty/verification PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

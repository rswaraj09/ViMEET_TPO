import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const { status } = await request.json() as { status: "OPEN" | "CLOSED" };

  if (!["OPEN", "CLOSED"].includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  try {
    const job = await prisma.job.update({
      where: { id },
      data: { status },
      include: { _count: { select: { applications: true } } },
    });
    return NextResponse.json({ job });
  } catch (error) {
    console.error("[admin/jobs/status PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

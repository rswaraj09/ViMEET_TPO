import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;

  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { _count: { select: { applications: true } } },
    });
    if (!job) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ job });
  } catch (error) {
    console.error("[admin/jobs/[id] GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;

  try {
    const body = await request.json();
    const job = await prisma.job.update({
      where: { id },
      data: {
        ...body,
        ...(body.deadline ? { deadline: new Date(body.deadline) } : {}),
      },
      include: { _count: { select: { applications: true } } },
    });
    return NextResponse.json({ job });
  } catch (error) {
    console.error("[admin/jobs/[id] PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;

  try {
    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ message: "Job deleted" });
  } catch (error) {
    console.error("[admin/jobs/[id] DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

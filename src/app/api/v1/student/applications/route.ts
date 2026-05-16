import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "STUDENT") return forbidden();

  try {
    const applications = await prisma.jobApplication.findMany({
      where: { studentId: user.id },
      include: { job: true },
      orderBy: { appliedAt: "desc" },
    });
    return NextResponse.json({ applications });
  } catch (error) {
    console.error("[student/applications GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "STUDENT") return forbidden();

  try {
    const { jobId } = await request.json();
    const existing = await prisma.jobApplication.findFirst({ where: { studentId: user.id, jobId } });
    if (existing) {
      return NextResponse.json({ message: "Already applied to this job." }, { status: 409 });
    }
    const application = await prisma.jobApplication.create({
      data: { studentId: user.id, jobId },
    });
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("[student/applications POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

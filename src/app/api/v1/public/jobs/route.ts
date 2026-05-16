import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("[public/jobs]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

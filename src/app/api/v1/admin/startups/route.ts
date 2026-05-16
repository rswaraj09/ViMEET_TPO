import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const items = await prisma.startup.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[admin/startups GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const body = await request.json();
    const startup = await prisma.startup.create({ data: body });
    return NextResponse.json({ startup }, { status: 201 });
  } catch (error) {
    console.error("[admin/startups POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

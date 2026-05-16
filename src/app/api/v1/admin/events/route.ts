import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const events = await prisma.event.findMany({ orderBy: { eventDate: "desc" } });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("[admin/events GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const body = await request.json();
    const event = await prisma.event.create({ data: { ...body, createdById: user.id } });
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("[admin/events POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { eventDate: "desc" },
    });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("[public/events]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

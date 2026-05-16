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

  try {
    const body = await request.json();
    const startup = await prisma.startup.update({ where: { id }, data: body });
    return NextResponse.json({ startup });
  } catch (error) {
    console.error("[admin/startups PATCH]", error);
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
    await prisma.startup.delete({ where: { id } });
    return NextResponse.json({ message: "Startup deleted" });
  } catch (error) {
    console.error("[admin/startups DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

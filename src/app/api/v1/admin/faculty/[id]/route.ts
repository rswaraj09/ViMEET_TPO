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
  const userId = Number(id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    const faculty = await prisma.user.findUnique({
      where: { id: userId, role: "FACULTY" },
      select: {
        id: true,
        fullName: true,
        emailId: true,
        contactNo: true,
        department: true,
        isHOD: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!faculty) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ faculty });
  } catch (error) {
    console.error("[admin/faculty/[id] GET]", error);
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
  const userId = Number(id);
  if (Number.isNaN(userId)) {
    return NextResponse.json({ message: "Invalid id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { fullName, contactNo, department, isHOD } = body as {
      fullName?: string;
      contactNo?: string;
      department?: string;
      isHOD?: boolean;
    };

    const faculty = await prisma.user.update({
      where: { id: userId, role: "FACULTY" },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(contactNo !== undefined && { contactNo }),
        ...(department !== undefined && { department: department as never }),
        ...(isHOD !== undefined && { isHOD }),
      },
      select: {
        id: true,
        fullName: true,
        emailId: true,
        contactNo: true,
        department: true,
        isHOD: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ faculty });
  } catch (error) {
    console.error("[admin/faculty/[id] PATCH]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const items = await prisma.user.findMany({
      where: { role: "FACULTY" },
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
      orderBy: { fullName: "asc" },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[admin/faculty GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const body = await request.json();
    const { fullName, emailId, contactNo, department, isHOD, password } = body as {
      fullName: string;
      emailId: string;
      contactNo?: string;
      department: string;
      isHOD?: boolean;
      password?: string;
    };

    const existing = await prisma.user.findUnique({ where: { emailId } });
    if (existing) {
      return NextResponse.json({ message: "Email already in use" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password ?? "changeme123", 10);

    const faculty = await prisma.user.create({
      data: {
        fullName,
        emailId,
        contactNo: contactNo ?? null,
        department: department as never,
        isHOD: isHOD ?? false,
        password: hashedPassword,
        role: "FACULTY",
        isVerified: true,
        isActive: true,
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

    return NextResponse.json({ faculty }, { status: 201 });
  } catch (error) {
    console.error("[admin/faculty POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

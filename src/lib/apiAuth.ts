import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export interface AuthPayload {
  id: number;
  role: string;
  emailId: string;
  department?: string | null;
  isHOD?: boolean;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function getAuthUser(request: NextRequest): Promise<AuthPayload | null> {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, emailId: true, department: true, isHOD: true, isVerified: true, isActive: true },
    });

    if (!user || !user.isActive || !user.isVerified) return null;

    return { id: user.id, role: user.role, emailId: user.emailId, department: user.department, isHOD: user.isHOD };
  } catch {
    return null;
  }
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

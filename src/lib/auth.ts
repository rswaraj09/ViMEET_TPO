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

export const generateToken = (payload: Pick<AuthPayload, "id" | "role" | "emailId">): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token: string): AuthPayload => {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
};

export const getUserFromToken = async (token: string): Promise<AuthPayload | null> => {
  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
        emailId: true,
        department: true,
        isHOD: true,
        isActive: true,
        isVerified: true,
      },
    });
    if (!user || !user.isActive || !user.isVerified) return null;
    return {
      id: user.id,
      role: user.role,
      emailId: user.emailId,
      department: user.department,
      isHOD: user.isHOD,
    };
  } catch {
    return null;
  }
};
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { welcomeEmail } from "@/lib/emailTemplates";
import { studentSignupSchema } from "@/lib/zodSchema";

const JWT_SECRET = process.env.JWT_SECRET as string;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = studentSignupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid input", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { fullName, emailId, studentId, department, academicYear, password, contactNo } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { emailId } });
    if (existing) {
      return NextResponse.json(
        { message: "User already exists with this email" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        fullName,
        emailId,
        studentId,
        department,
        academicYear,
        contactNo,
        password: hashedPassword,
        role: "STUDENT",
      },
    });

    const token = jwt.sign({ id: user.id, role: user.role, emailId: user.emailId }, JWT_SECRET, { expiresIn: "7d" });

    await sendMail({ to: emailId, ...welcomeEmail(fullName) });

    const response = NextResponse.json(
      { message: "Account created. Pending admin approval.", userId: user.id },
      { status: 201 }
    );
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch (error) {
    console.error("[signup]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

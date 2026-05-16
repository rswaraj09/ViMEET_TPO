import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { passwordResetEmail } from "@/lib/emailTemplates";
import { forgotPasswordSchema } from "@/lib/zodSchema";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid email", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { emailId } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { emailId } });
    if (!user) {
      return NextResponse.json({ message: "If the email exists, a reset link was sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordExpires: expiry },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;
    await sendMail({ to: emailId, ...passwordResetEmail(user.fullName, resetUrl) });

    return NextResponse.json({ message: "If the email exists, a reset link was sent." });
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

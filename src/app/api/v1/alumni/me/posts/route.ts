import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ALUMNI") return forbidden();

  try {
    const items = await prisma.alumniPost.findMany({
      where: { alumniId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[alumni/me/posts GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ALUMNI") return forbidden();

  try {
    const body = await request.json();
    const { postType, title, body: postBody, companyName, role, contactInfo } = body;

    const post = await prisma.alumniPost.create({
      data: {
        alumniId: user.id,
        postType,
        title,
        body: postBody,
        companyName,
        role,
        contactInfo,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("[alumni/me/posts POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

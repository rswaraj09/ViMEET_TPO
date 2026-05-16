import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import { uploadBuffer, MAX_FILE_SIZE_BYTES } from "@/lib/cloudinary";

const ALLOWED_FIELDS = [
  "sscMarksheetUrl",
  "hscMarksheetUrl",
  "diplomaMarksheetUrl",
  "sem1MarksheetUrl",
  "sem2MarksheetUrl",
  "sem3MarksheetUrl",
  "sem4MarksheetUrl",
  "sem5MarksheetUrl",
  "sem6MarksheetUrl",
  "sem7MarksheetUrl",
  "sem8MarksheetUrl",
] as const;

type MarksheetField = (typeof ALLOWED_FIELDS)[number];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ field: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

  const { field } = await params;

  if (!ALLOWED_FIELDS.includes(field as MarksheetField)) {
    return NextResponse.json(
      { message: `Invalid field. Allowed: ${ALLOWED_FIELDS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ message: "File exceeds 2 MB limit" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(buffer, {
      folder: "tpo/marksheets",
      resourceType: "auto",
    });

    await prisma.marks.upsert({
      where: { userId: user.id },
      create: { userId: user.id, [field]: result.secure_url },
      update: { [field]: result.secure_url },
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("[student/marks/upload POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

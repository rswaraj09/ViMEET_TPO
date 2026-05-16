import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import { uploadBuffer, MAX_FILE_SIZE_BYTES } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (!["STUDENT", "ALUMNI"].includes(user.role)) return forbidden();

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
      folder: "tpo/certificates",
      resourceType: "auto",
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("[student/uploads/certificate POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

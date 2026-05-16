import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";
import { uploadBuffer } from "@/lib/cloudinary";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  try {
    const url = new URL(request.url);
    const fileType = url.searchParams.get("fileType") || undefined;

    // Build filter based on role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };

    if (fileType) where.fileType = fileType;

    if (user.role === "STUDENT") {
      // Students see: resources for their dept+year, OR admin resources (no dept)
      const studentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { department: true, academicYear: true },
      });
      where.OR = [
        { department: null }, // admin-level docs visible to all
        {
          department: studentUser?.department ?? undefined,
          academicYear: studentUser?.academicYear ?? undefined,
        },
        {
          department: studentUser?.department ?? undefined,
          academicYear: null,
        },
      ];
    } else if (user.role === "FACULTY") {
      // Faculty see their dept resources + admin resources
      where.OR = [
        { department: null },
        { department: user.department ?? undefined },
      ];
    }
    // ADMIN sees everything (no additional filter)

    const resources = await prisma.resource.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      include: {
        addedBy: { select: { fullName: true, role: true, isHOD: true, department: true } },
      },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("[resources GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  // Only ADMIN or HOD faculty can add resources
  if (user.role !== "ADMIN" && !(user.role === "FACULTY" && user.isHOD)) {
    return forbidden();
  }

  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || null;
    const fileType = formData.get("fileType") as string;
    const department = (formData.get("department") as string) || null;
    const academicYear = (formData.get("academicYear") as string) || null;
    const file = formData.get("file") as File | null;
    const fileUrl = formData.get("fileUrl") as string | null;

    if (!title || !fileType) {
      return NextResponse.json({ message: "title and fileType are required" }, { status: 400 });
    }

    // HOD can only add to their own department
    const resolvedDepartment =
      user.role === "FACULTY" ? (user.department ?? null) : department;

    let resolvedFileUrl = fileUrl;

    if (file && !resolvedFileUrl) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const result = await uploadBuffer(buffer, {
        folder: "tpo/resources",
        resourceType: "raw",
      });
      resolvedFileUrl = result.secure_url;
    }

    if (!resolvedFileUrl) {
      return NextResponse.json({ message: "A file or fileUrl is required" }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        fileUrl: resolvedFileUrl,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fileType: fileType as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        department: (resolvedDepartment as any) ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        academicYear: (academicYear as any) ?? null,
        addedById: user.id,
      },
      include: {
        addedBy: { select: { fullName: true, role: true, isHOD: true, department: true } },
      },
    });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error) {
    console.error("[resources POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

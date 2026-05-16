import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

const studentSelect = {
  id: true,
  fullName: true,
  emailId: true,
  studentId: true,
  department: true,
  academicYear: true,
  profilePic: true,
};

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  try {
    const [verificationRequests, internships, achievements, certificates] =
      await Promise.all([
        prisma.verificationRequest.findMany({
          where: { status: "PENDING", entityType: { in: ["PROFILE", "MARKS"] } },
          include: { student: { select: studentSelect } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.internship.findMany({
          where: { isVerified: false },
          include: { student: { select: studentSelect } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.achievement.findMany({
          where: { isVerified: false },
          include: { student: { select: studentSelect } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.certificate.findMany({
          where: { isVerified: false },
          include: { student: { select: studentSelect } },
          orderBy: { createdAt: "asc" },
        }),
      ]);

    const items = [
      ...verificationRequests.map((vr) => ({
        id: vr.id,
        kind: "VERIFICATION_REQUEST" as const,
        entityType: vr.entityType,
        entityId: vr.entityId,
        createdAt: vr.createdAt.toISOString(),
        student: vr.student,
        changes: vr.changes,
      })),
      ...internships.map((i) => ({
        id: i.id,
        kind: "INTERNSHIP" as const,
        entityType: "INTERNSHIP" as const,
        entityId: null,
        createdAt: i.createdAt.toISOString(),
        student: i.student,
        data: {
          companyName: i.companyName,
          role: i.role,
          roleDescription: i.roleDescription,
          duration: i.duration,
          startDate: i.startDate.toISOString(),
          endDate: i.endDate?.toISOString() ?? null,
          certificateUrl: i.certificateUrl,
          hrName: i.hrName,
          hrEmail: i.hrEmail,
          hrPhone: i.hrPhone,
        },
      })),
      ...achievements.map((a) => ({
        id: a.id,
        kind: "ACHIEVEMENT" as const,
        entityType: "ACHIEVEMENT" as const,
        entityId: null,
        createdAt: a.createdAt.toISOString(),
        student: a.student,
        data: {
          title: a.title,
          description: a.description,
          category: a.category,
          certificateUrl: a.certificateUrl,
          achievementDate: a.achievementDate?.toISOString() ?? null,
        },
      })),
      ...certificates.map((c) => ({
        id: c.id,
        kind: "CERTIFICATE" as const,
        entityType: "CERTIFICATE" as const,
        entityId: null,
        createdAt: c.createdAt.toISOString(),
        student: c.student,
        data: {
          title: c.title,
          issuingOrg: c.issuingOrg,
          issueDate: c.issueDate?.toISOString() ?? null,
          expiryDate: c.expiryDate?.toISOString() ?? null,
          credentialId: c.credentialId,
          credentialUrl: c.credentialUrl,
          certificateUrl: c.certificateUrl,
        },
      })),
    ];

    items.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[admin/verifications GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, unauthorized, forbidden } from "@/lib/apiAuth";

// Returns a unified pending verification queue for the faculty's department.
// Combines: VerificationRequests (PROFILE/MARKS) + unverified Internships,
// Achievements, and Certificates — each tagged with a `kind` discriminator.
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();
  if (user.role !== "FACULTY") return forbidden();

  const dept = (user.department ?? undefined) as never;

  try {
    const [verificationRequests, internships, achievements, certificates] = await Promise.all([
      prisma.verificationRequest.findMany({
        where: {
          status: "PENDING",
          entityType: { in: ["PROFILE", "MARKS"] },
          student: { department: dept },
        },
        include: {
          student: {
            select: {
              id: true, fullName: true, emailId: true,
              studentId: true, department: true, academicYear: true, profilePic: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.internship.findMany({
        where: { isVerified: false, student: { department: dept, role: "STUDENT" } },
        include: {
          student: {
            select: {
              id: true, fullName: true, emailId: true,
              studentId: true, department: true, academicYear: true, profilePic: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.achievement.findMany({
        where: { isVerified: false, student: { department: dept, role: "STUDENT" } },
        include: {
          student: {
            select: {
              id: true, fullName: true, emailId: true,
              studentId: true, department: true, academicYear: true, profilePic: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.certificate.findMany({
        where: { isVerified: false, student: { department: dept, role: "STUDENT" } },
        include: {
          student: {
            select: {
              id: true, fullName: true, emailId: true,
              studentId: true, department: true, academicYear: true, profilePic: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const items = [
      ...verificationRequests.map((r) => ({
        id: r.id,
        kind: "VERIFICATION_REQUEST" as const,
        entityType: r.entityType,
        entityId: r.entityId,
        createdAt: r.createdAt,
        student: r.student,
        changes: r.changes as Record<string, { oldValue: unknown; newValue: unknown }>,
      })),
      ...internships.map((i) => ({
        id: i.id,
        kind: "INTERNSHIP" as const,
        entityType: "INTERNSHIP" as const,
        entityId: i.id,
        createdAt: i.createdAt,
        student: i.student,
        data: {
          companyName: i.companyName,
          role: i.role,
          roleDescription: i.roleDescription,
          duration: i.duration,
          startDate: i.startDate,
          endDate: i.endDate,
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
        entityId: a.id,
        createdAt: a.createdAt,
        student: a.student,
        data: {
          title: a.title,
          description: a.description,
          category: a.category,
          certificateUrl: a.certificateUrl,
          achievementDate: a.achievementDate,
        },
      })),
      ...certificates.map((c) => ({
        id: c.id,
        kind: "CERTIFICATE" as const,
        entityType: "CERTIFICATE" as const,
        entityId: c.id,
        createdAt: c.createdAt,
        student: c.student,
        data: {
          title: c.title,
          issuingOrg: c.issuingOrg,
          issueDate: c.issueDate,
          expiryDate: c.expiryDate,
          credentialId: c.credentialId,
          credentialUrl: c.credentialUrl,
          certificateUrl: c.certificateUrl,
        },
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[faculty/verifications GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { PrismaClient, Department, AcademicYear } from "./output/prismaclient";

dotenv.config();

const prisma = new PrismaClient();

// ==================== USERS (one per role, known test credentials) ====================

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@pillai.edu.in";
  const password = process.env.ADMIN_PASSWORD || "Admin@12345";
  const fullName = process.env.ADMIN_NAME || "TPO Admin";

  const existing = await prisma.user.findUnique({ where: { emailId: email } });

  if (existing) {
    if (existing.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN", isVerified: true, isActive: true },
      });
      console.log(`↻ Promoted existing user to ADMIN: ${email}`);
    } else {
      console.log(`✓ Admin already exists: ${email}`);
    }
    return existing.id;
  }

  const hashed = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      fullName,
      emailId: email,
      password: hashed,
      role: "ADMIN",
      isVerified: true,
      isActive: true,
    },
  });

  console.log("✓ Admin created");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  return admin.id;
}

async function seedFaculty() {
  const email = process.env.FACULTY_EMAIL || "faculty@pillai.edu.in";
  const password = process.env.FACULTY_PASSWORD || "Faculty@12345";
  const fullName = process.env.FACULTY_NAME || "Dr. Test Faculty";
  const department = (process.env.FACULTY_DEPARTMENT ||
    "COMPUTER") as Department;

  const existing = await prisma.user.findUnique({ where: { emailId: email } });
  if (existing) {
    if (existing.role !== "FACULTY") {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: "FACULTY",
          department,
          isVerified: true,
          isActive: true,
        },
      });
      console.log(`↻ Promoted existing user to FACULTY: ${email}`);
    } else {
      console.log(`✓ Faculty already exists: ${email}`);
    }
    return existing.id;
  }

  const hashed = await bcrypt.hash(password, 10);

  const faculty = await prisma.user.create({
    data: {
      fullName,
      emailId: email,
      password: hashed,
      role: "FACULTY",
      department,
      isHOD: false,
      isVerified: true,
      isActive: true,
    },
  });

  console.log("✓ Faculty created");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  return faculty.id;
}

async function seedStudent() {
  const email = process.env.STUDENT_EMAIL || "student@pillai.edu.in";
  const password = process.env.STUDENT_PASSWORD || "Student@12345";
  const fullName = process.env.STUDENT_NAME || "Test Student";
  const department = (process.env.STUDENT_DEPARTMENT || "COMPUTER") as Department;
  const academicYear = (process.env.STUDENT_ACADEMIC_YEAR ||
    "FOURTH_YEAR") as AcademicYear;

  const existing = await prisma.user.findUnique({ where: { emailId: email } });
  if (existing) {
    if (existing.role !== "STUDENT") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "STUDENT", department, academicYear, isVerified: true, isActive: true },
      });
      console.log(`↻ Promoted existing user to STUDENT: ${email}`);
    } else {
      console.log(`✓ Student already exists: ${email}`);
    }
    return existing.id;
  }

  const hashed = await bcrypt.hash(password, 10);

  const student = await prisma.user.create({
    data: {
      fullName,
      emailId: email,
      password: hashed,
      role: "STUDENT",
      department,
      academicYear,
      studentId: process.env.STUDENT_ROLL_NO || "PU2022CS045",
      skills: ["JavaScript", "React", "Node.js", "SQL"],
      isVerified: true,
      isActive: true,
    },
  });

  console.log("✓ Student created");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  return student.id;
}

async function seedAlumni() {
  const email = process.env.ALUMNI_EMAIL || "alumni@pillai.edu.in";
  const password = process.env.ALUMNI_PASSWORD || "Alumni@12345";
  const fullName = process.env.ALUMNI_NAME || "Test Alumni";
  const department = (process.env.ALUMNI_DEPARTMENT || "COMPUTER") as Department;

  const existing = await prisma.user.findUnique({ where: { emailId: email } });
  if (existing) {
    if (existing.role !== "ALUMNI") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ALUMNI", department, isVerified: true, isActive: true, isPlaced: true },
      });
      console.log(`↻ Promoted existing user to ALUMNI: ${email}`);
    } else {
      console.log(`✓ Alumni already exists: ${email}`);
    }
    return existing.id;
  }

  const hashed = await bcrypt.hash(password, 10);

  const alumni = await prisma.user.create({
    data: {
      fullName,
      emailId: email,
      password: hashed,
      role: "ALUMNI",
      department,
      studentId: process.env.ALUMNI_ROLL_NO || "PU2018CS012",
      skills: ["Java", "System Design", "Leadership"],
      isPlaced: true,
      isVerified: true,
      isActive: true,
    },
  });

  console.log("✓ Alumni created");
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  return alumni.id;
}

// ==================== DEMO DATA (covers every remaining table) ====================

async function seedMarks(studentId: number) {
  const sems = { sem1: 8.2, sem2: 8.4, sem3: 8.6, sem4: 8.5, sem5: 8.8, sem6: 8.9 };
  await prisma.marks.upsert({
    where: { userId: studentId },
    update: {},
    create: {
      userId: studentId,
      sscPercentage: 88.4,
      hscPercentage: 82.6,
      ...sems,
      isVerified: true,
    },
  });

  const values = Object.values(sems);
  const avgCgpa = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
  await prisma.user.update({ where: { id: studentId }, data: { avgCgpa } });
  console.log("✓ Marks seeded for student");
}

async function seedInternship(studentId: number) {
  const exists = await prisma.internship.findFirst({
    where: { userId: studentId, companyName: "TechNova Solutions" },
  });
  if (exists) return;

  await prisma.internship.create({
    data: {
      userId: studentId,
      companyName: "TechNova Solutions",
      role: "Software Development Intern",
      roleDescription: "Built internal analytics dashboards using React and Node.js.",
      duration: "8 weeks",
      startDate: new Date("2025-05-15"),
      endDate: new Date("2025-07-10"),
      hrName: "Priya Sharma",
      hrEmail: "priya.sharma@technova.example.com",
      isVerified: true,
    },
  });
  console.log("✓ Internship seeded for student");
}

async function seedAchievement(studentId: number) {
  const title = "Smart India Hackathon - Finalist";
  const exists = await prisma.achievement.findFirst({ where: { userId: studentId, title } });
  if (exists) return;

  await prisma.achievement.create({
    data: {
      userId: studentId,
      title,
      description: "Reached the national finals building an AI-based crop advisory tool.",
      category: "technical",
      achievementDate: new Date("2025-03-20"),
      isVerified: true,
    },
  });
  console.log("✓ Achievement seeded for student");
}

async function seedProject(studentId: number) {
  const title = "Campus Placement Tracker";
  const exists = await prisma.project.findFirst({ where: { userId: studentId, title } });
  if (exists) return;

  await prisma.project.create({
    data: {
      userId: studentId,
      title,
      description: "A mini version of a TPO portal, built as a semester project.",
      techStack: ["Next.js", "PostgreSQL", "Prisma"],
      repoUrl: "https://github.com/example/placement-tracker",
      startDate: new Date("2025-01-10"),
      endDate: new Date("2025-04-01"),
      isVerified: true,
    },
  });
  console.log("✓ Project seeded for student");
}

async function seedCertificate(studentId: number) {
  const title = "AWS Cloud Practitioner";
  const exists = await prisma.certificate.findFirst({ where: { userId: studentId, title } });
  if (exists) return;

  await prisma.certificate.create({
    data: {
      userId: studentId,
      title,
      issuingOrg: "Amazon Web Services",
      issueDate: new Date("2025-02-01"),
      expiryDate: new Date("2028-02-01"),
      credentialId: "AWS-CCP-DEMO-001",
      isVerified: true,
    },
  });
  console.log("✓ Certificate seeded for student");
}

async function seedVerificationRequest(studentId: number) {
  const exists = await prisma.verificationRequest.findFirst({
    where: { userId: studentId, entityType: "PROFILE" },
  });
  if (exists) return;

  await prisma.verificationRequest.create({
    data: {
      userId: studentId,
      entityType: "PROFILE",
      changes: { contactNo: { oldValue: "9800000000", newValue: "9811122233" } },
      status: "PENDING",
    },
  });
  console.log("✓ Verification request seeded for student");
}

async function seedAmbassadorAssignment(studentId: number) {
  await prisma.ambassadorAssignment.upsert({
    where: {
      studentId_roleName_servedAcademicYear: {
        studentId,
        roleName: "TPO Head",
        servedAcademicYear: "2025-2026",
      },
    },
    update: {},
    create: { studentId, roleName: "TPO Head", servedAcademicYear: "2025-2026" },
  });
  console.log("✓ Ambassador assignment seeded for student");
}

async function seedAlumniProfile(alumniId: number) {
  const profile = await prisma.alumniProfile.upsert({
    where: { userId: alumniId },
    update: {},
    create: {
      userId: alumniId,
      currentOrg: "Google India",
      currentRole: "Software Engineer II",
      package: "24 LPA",
      graduationYear: 2023,
      placedBy: "Campus Placement",
    },
  });
  console.log("✓ Alumni profile seeded");
  return profile.id;
}

async function seedPastOrg(alumniProfileId: number) {
  const companyName = "Infosys";
  const exists = await prisma.pastOrg.findFirst({
    where: { alumniId: alumniProfileId, companyName },
  });
  if (exists) return;

  await prisma.pastOrg.create({
    data: {
      alumniId: alumniProfileId,
      companyName,
      role: "Systems Engineer",
      joiningDate: new Date("2023-07-01"),
      leavingDate: new Date("2024-12-15"),
    },
  });
  console.log("✓ Past organization seeded for alumni");
}

async function seedHigherStudies(alumniProfileId: number) {
  await prisma.higherStudies.upsert({
    where: { alumniId: alumniProfileId },
    update: {},
    create: {
      alumniId: alumniProfileId,
      collegeName: "Michigan State University",
      branch: "MS Computer Science",
      location: "USA",
      joiningDate: new Date("2025-08-01"),
    },
  });
  console.log("✓ Higher studies record seeded for alumni");
}

async function seedAlumniPost(alumniUserId: number) {
  const title = "Referral: SDE roles at Google India";
  const exists = await prisma.alumniPost.findFirst({ where: { alumniId: alumniUserId, title } });
  if (exists) return;

  await prisma.alumniPost.create({
    data: {
      alumniId: alumniUserId,
      postType: "REFERRAL",
      title,
      body: "My team is hiring SDE-1s. Happy to refer strong grads — DM your resume.",
      companyName: "Google India",
      role: "Software Engineer",
      contactInfo: "alumni@pillai.edu.in",
    },
  });
  console.log("✓ Alumni post seeded");
}

async function seedJob(adminId: number) {
  const jobTitle = "Software Engineer Trainee";
  const companyName = "TechNova Solutions";
  let job = await prisma.job.findFirst({ where: { companyName, jobTitle } });

  if (!job) {
    job = await prisma.job.create({
      data: {
        createdById: adminId,
        companyName,
        jobTitle,
        description: "Full-stack development role for fresh graduates, working across our product suite.",
        package: "6 LPA",
        location: "Pune, Maharashtra",
        locationType: "HYBRID",
        jobType: "FULL_TIME",
        eligibleDepartments: ["COMPUTER", "CSE", "EXTC"],
        minCgpa: 6.5,
        eligibleYears: ["FOURTH_YEAR"],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        rounds: ["Online Test", "Technical Interview", "HR Interview"],
        openings: 10,
        status: "OPEN",
      },
    });
    console.log("✓ Job seeded");
  }
  return job.id;
}

async function seedJobApplication(jobId: string, studentId: number) {
  await prisma.jobApplication.upsert({
    where: { jobId_studentId: { jobId, studentId } },
    update: {},
    create: { jobId, studentId, status: "SHORTLISTED" },
  });
  console.log("✓ Job application seeded");
}

async function seedEvent(adminId: number) {
  const title = "Pre-Placement Talk - TechNova Solutions";
  const exists = await prisma.event.findFirst({ where: { title } });
  if (exists) return;

  await prisma.event.create({
    data: {
      title,
      description: "Company overview, role expectations and Q&A session ahead of the drive.",
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      eventTime: "11:00 AM",
      location: "Seminar Hall, Block A",
      type: "PLACEMENT_DRIVE",
      status: "UPCOMING",
      createdById: adminId,
    },
  });
  console.log("✓ Event seeded");
}

async function seedNotifications(ids: {
  studentId: number;
  alumniId: number;
  facultyId: number;
  adminId: number;
}) {
  const items = [
    {
      userId: ids.studentId,
      title: "New job posted",
      message: "TechNova Solutions is hiring Software Engineer Trainees.",
      type: "JOB_POSTED" as const,
    },
    {
      userId: ids.alumniId,
      title: "Welcome, Alumni!",
      message: "Your alumni profile is now active.",
      type: "ALUMNI_POST" as const,
    },
    {
      userId: ids.facultyId,
      title: "New registration pending",
      message: "A new student registration is awaiting your review.",
      type: "PENDING_VERIFICATION" as const,
    },
    {
      userId: ids.adminId,
      title: "Demo data seeded",
      message: "Test accounts and sample records were seeded successfully.",
      type: "ACCOUNT_STATUS" as const,
    },
  ];

  for (const item of items) {
    const exists = await prisma.notification.findFirst({
      where: { userId: item.userId, title: item.title },
    });
    if (exists) continue;
    await prisma.notification.create({ data: item });
  }
  console.log("✓ Notifications seeded");
}

async function seedResource(facultyId: number) {
  const title = "Aptitude Prep Guide - Quantitative";
  const exists = await prisma.resource.findFirst({ where: { title } });
  if (exists) return;

  await prisma.resource.create({
    data: {
      title,
      description: "Practice guide covering quantitative aptitude topics for placement tests.",
      fileUrl: "https://example.com/resources/quant-guide.pdf",
      fileType: "OTHER",
      department: "COMPUTER",
      academicYear: "FOURTH_YEAR",
      addedById: facultyId,
    },
  });
  console.log("✓ Resource seeded");
}

async function seedStudentNote(studentId: number, facultyId: number) {
  const exists = await prisma.studentNote.findFirst({ where: { studentId, authorId: facultyId } });
  if (exists) return;

  await prisma.studentNote.create({
    data: {
      studentId,
      authorId: facultyId,
      content: "Strong performer in mock interviews; recommend for premium drives.",
    },
  });
  console.log("✓ Student note seeded");
}

async function seedAptitudeTest(facultyId: number, studentId: number) {
  let test = await prisma.aptitudeTest.findFirst({ where: { title: "General Aptitude Screening" } });
  if (!test) {
    test = await prisma.aptitudeTest.create({
      data: {
        title: "General Aptitude Screening",
        description: "Screening test covering quantitative and logical reasoning.",
        rules: ["No tab switching", "Submit before time runs out"],
        totalTime: 30,
        totalMarks: 10,
        minimumMarks: 5,
        category: "APTITUDE",
        status: "PUBLISHED",
        isActive: true,
        eligibleYears: ["FOURTH_YEAR"],
        createdById: facultyId,
      },
    });
    console.log("✓ Aptitude test seeded");
  }

  let section = await prisma.aptitudeSection.findFirst({ where: { testId: test.id, name: "Quantitative" } });
  if (!section) {
    section = await prisma.aptitudeSection.create({
      data: { testId: test.id, name: "Quantitative", order: 1, timeLimit: 15 },
    });
  }

  let question = await prisma.question.findFirst({ where: { testId: test.id, sectionId: section.id } });
  if (!question) {
    question = await prisma.question.create({
      data: {
        testId: test.id,
        sectionId: section.id,
        question: "What is 15% of 200?",
        option1: "20",
        option2: "30",
        option3: "25",
        option4: "35",
        correctOption: "2",
        marks: 10,
      },
    });
  }

  await prisma.testSubmission.upsert({
    where: {
      testId_studentId_attemptNumber: { testId: test.id, studentId, attemptNumber: 1 },
    },
    update: {},
    create: {
      testId: test.id,
      studentId,
      attemptNumber: 1,
      submittedAt: new Date(),
      answers: { [String(question.id)]: question.correctOption },
      autoScore: question.marks,
      finalScore: question.marks,
      status: "REVIEWED",
      reviewedById: facultyId,
      reviewedAt: new Date(),
    },
  });
  console.log("✓ Test submission seeded");
}

async function seedBroadcastJob(adminId: number, studentId: number) {
  const subject = "Welcome to the Pillai University TPO Portal";
  const exists = await prisma.broadcastJob.findFirst({ where: { subject } });
  if (exists) return;

  await prisma.broadcastJob.create({
    data: {
      type: "CUSTOM",
      subject,
      htmlBody: "<p>Welcome to the new placement portal!</p>",
      recipientIds: [studentId],
      status: "COMPLETED",
      totalCount: 1,
      sentCount: 1,
      createdById: adminId,
    },
  });
  console.log("✓ Broadcast job seeded");
}

async function seedStartup() {
  const name = "CampusForge Labs";
  const exists = await prisma.startup.findFirst({ where: { name } });
  if (exists) return;

  await prisma.startup.create({
    data: {
      name,
      tagline: "Building tools for campus placement teams.",
      industry: "EdTech",
      website: "https://example.com",
      location: "Pune, Maharashtra",
      contactName: "Founder Demo",
      contactEmail: "founder@campusforge.example.com",
      foundedYear: 2024,
    },
  });
  console.log("✓ Startup seeded");
}

async function main() {
  console.log("→ Seeding test users (one per role)...");
  const adminId = await seedAdmin();
  const facultyId = await seedFaculty();
  const studentId = await seedStudent();
  const alumniId = await seedAlumni();

  console.log("→ Seeding demo data across remaining tables...");
  await seedMarks(studentId);
  await seedInternship(studentId);
  await seedAchievement(studentId);
  await seedProject(studentId);
  await seedCertificate(studentId);
  await seedVerificationRequest(studentId);
  await seedAmbassadorAssignment(studentId);

  const alumniProfileId = await seedAlumniProfile(alumniId);
  await seedPastOrg(alumniProfileId);
  await seedHigherStudies(alumniProfileId);
  await seedAlumniPost(alumniId);

  const jobId = await seedJob(adminId);
  await seedJobApplication(jobId, studentId);
  await seedEvent(adminId);
  await seedNotifications({ studentId, alumniId, facultyId, adminId });
  await seedResource(facultyId);
  await seedStudentNote(studentId, facultyId);
  await seedAptitudeTest(facultyId, studentId);
  await seedBroadcastJob(adminId, studentId);
  await seedStartup();

  console.log("\n✓ Seed complete. Test credentials:");
  console.log(`  ADMIN    -> ${process.env.ADMIN_EMAIL || "admin@pillai.edu.in"} / ${process.env.ADMIN_PASSWORD || "Admin@12345"}`);
  console.log(`  FACULTY  -> ${process.env.FACULTY_EMAIL || "faculty@pillai.edu.in"} / ${process.env.FACULTY_PASSWORD || "Faculty@12345"}`);
  console.log(`  STUDENT  -> ${process.env.STUDENT_EMAIL || "student@pillai.edu.in"} / ${process.env.STUDENT_PASSWORD || "Student@12345"}`);
  console.log(`  ALUMNI   -> ${process.env.ALUMNI_EMAIL || "alumni@pillai.edu.in"} / ${process.env.ALUMNI_PASSWORD || "Alumni@12345"}`);
}

main()
  .catch((err) => {
    console.error("✗ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

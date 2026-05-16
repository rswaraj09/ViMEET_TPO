import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { PrismaClient, Department } from "./output/prismaclient";

dotenv.config();

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@vishwaniketan.edu.in";
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
  console.log("  Change the password immediately after first login.");
  return admin.id;
}

async function seedFaculty() {
  const email = process.env.FACULTY_EMAIL || "faculty@vishwaniketan.edu.in";
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

async function main() {
  console.log("→ Seeding admin user...");
  await seedAdmin();
  console.log("→ Seeding faculty user...");
  await seedFaculty();
}

main()
  .catch((err) => {
    console.error("✗ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

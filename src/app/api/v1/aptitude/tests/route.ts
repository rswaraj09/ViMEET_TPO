import { NextResponse } from "next/server";

// Superseded by role-specific routes:
//   Students  → /api/v1/aptitude/student/tests
//   Faculty   → /api/v1/aptitude/faculty/tests
export async function GET() {
  return NextResponse.json(
    { message: "Use /api/v1/aptitude/student/tests or /api/v1/aptitude/faculty/tests" },
    { status: 301 }
  );
}
export async function POST() {
  return NextResponse.json(
    { message: "Use /api/v1/aptitude/faculty/tests" },
    { status: 301 }
  );
}

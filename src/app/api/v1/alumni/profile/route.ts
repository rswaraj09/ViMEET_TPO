import { NextResponse } from "next/server";

// Superseded by /alumni/me — kept to avoid 404 on any stale client calls
export async function GET() {
  return NextResponse.json(
    { message: "This endpoint has moved to /api/v1/alumni/me" },
    { status: 301 }
  );
}
export async function PUT() {
  return NextResponse.json(
    { message: "This endpoint has moved to /api/v1/alumni/me" },
    { status: 301 }
  );
}

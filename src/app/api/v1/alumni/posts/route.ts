import { NextResponse } from "next/server";

// Superseded by /alumni/feed (GET) and /alumni/me/posts (POST)
export async function GET() {
  return NextResponse.json(
    { message: "This endpoint has moved to /api/v1/alumni/feed" },
    { status: 301 }
  );
}
export async function POST() {
  return NextResponse.json(
    { message: "This endpoint has moved to /api/v1/alumni/me/posts" },
    { status: 301 }
  );
}

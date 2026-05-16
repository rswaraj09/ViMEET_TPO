import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

const PROTECTED_ROUTES: Record<string, string[]> = {
  "/student": ["STUDENT"],
  "/faculty": ["FACULTY"],
  "/admin": ["ADMIN"],
  "/alumni": ["ALUMNI"],
};

const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("token")?.value;

  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const protectedEntry = Object.entries(PROTECTED_ROUTES).find(([prefix]) =>
    pathname.startsWith(prefix)
  );

  if (isAuthRoute) {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const role = payload.role as string;
        const dest =
          role === "ADMIN" ? "/admin" :
          role === "FACULTY" ? "/faculty" :
          role === "ALUMNI" ? "/alumni" : "/student";
        return NextResponse.redirect(new URL(dest, request.url));
      } catch {
        // Invalid token — allow to auth page
      }
    }
    return NextResponse.next();
  }

  if (protectedEntry) {
    const [, allowedRoles] = protectedEntry;

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const role = payload.role as string;

      if (!allowedRoles.includes(role)) {
        const dest =
          role === "ADMIN" ? "/admin" :
          role === "FACULTY" ? "/faculty" :
          role === "ALUMNI" ? "/alumni" : "/student";
        return NextResponse.redirect(new URL(dest, request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/faculty/:path*",
    "/admin/:path*",
    "/alumni/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password/:path*",
  ],
};

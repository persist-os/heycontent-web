import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./app/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");

  if (isAuthPage) {
    if (session?.user) {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/chat",
    "/chat/:path*",
    "/settings",
    "/settings/:path*",
    "/notes",
    "/notes/:path*",
    "/partnerships",
    "/partnerships/:path*",
    "/audience",
    "/audience/:path*",
    "/ai-insights",
    "/ai-insights/:path*",
    "/test-rag",
    "/test-rag/:path*",
    "/login",
    "/login/:path*"
  ]
}; 
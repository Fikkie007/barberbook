import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Subdomain routing for multi-tenant
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";

  // Extract subdomain
  const isLocalhost = host.includes("localhost");
  const hostParts = host.split(".");
  const isSubdomain =
    (isLocalhost && hostParts.length > 1 && hostParts[0] !== "www") ||
    (!isLocalhost && hostParts.length > 2 && hostParts[0] !== "www");

  // Get token for auth check
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Public paths that don't require authentication
  const publicPaths = ["/auth/login", "/auth/register", "/api"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Root path
  const isRootPath = pathname === "/";

  // Handle subdomain requests (public booking pages)
  if (isSubdomain) {
    const subdomain = isLocalhost ? hostParts[0] : hostParts[0];

    // Skip static files and api
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // Rewrite to booking page with subdomain parameter
    const url = request.nextUrl.clone();
    url.pathname = `/booking/${subdomain}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Protected dashboard routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/settings")) {
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from auth pages
  if (isPublicPath && token && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
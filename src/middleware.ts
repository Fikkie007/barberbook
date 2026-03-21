import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Subdomain routing for multi-tenant
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Get base domain from env (e.g., "barberbook.my.id" or "localhost:3000")
  const baseDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
  const baseDomainWithoutPort = baseDomain.split(":")[0];
  const hostWithoutPort = host.split(":")[0];

  // Check if this is the base domain or www version
  const isBaseDomain =
    hostWithoutPort === baseDomainWithoutPort ||
    hostWithoutPort === `www.${baseDomainWithoutPort}`;

  // Extract subdomain - it's a subdomain if it's not the base domain and has more parts
  const baseParts = baseDomainWithoutPort.split(".").length;
  const hostParts = hostWithoutPort.split(".").length;
  const isSubdomain = !isBaseDomain && hostParts > baseParts;

  // Get token for auth check
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Public paths that don't require authentication
  const publicPaths = ["/auth/login", "/auth/register", "/api"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Handle subdomain requests (public booking pages)
  if (isSubdomain) {
    // Extract subdomain (e.g., "myshop" from "myshop.barberbook.my.id")
    const subdomain = hostWithoutPort.split(".")[0];

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
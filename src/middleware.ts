import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// NextAuth v5 default cookie names (keep aligned with auth config)
const SECURE_SESSION_COOKIE = "__Secure-authjs.session-token";
const SESSION_COOKIE = "authjs.session-token";

/**
 * Get the actual protocol from the request (handles reverse proxy)
 */
function getProtocol(request: NextRequest): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto;
  }
  return request.nextUrl.protocol.replace(":", "");
}

/**
 * Construct a URL with the correct protocol
 */
function getSecureUrl(request: NextRequest, path: string): URL {
  const protocol = getProtocol(request);
  const host = request.headers.get("host") || "localhost:3000";
  return new URL(`${protocol}://${host}${path}`);
}

/**
 * Get the session token cookie name based on protocol
 */
function getSessionTokenCookieName(request: NextRequest): string {
  const protocol = getProtocol(request);
  return protocol === "https" ? SECURE_SESSION_COOKIE : SESSION_COOKIE;
}

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

  // Check if host ends with base domain (to prevent cross-domain false positives)
  const isUnderBaseDomain =
    hostWithoutPort === baseDomainWithoutPort ||
    hostWithoutPort.endsWith(`.${baseDomainWithoutPort}`);

  // Extract subdomain - it's a subdomain if it's under base domain but not the base itself
  const isSubdomain = isUnderBaseDomain && !isBaseDomain;

  // Public paths that don't require authentication
  const publicPaths = ["/auth/login", "/auth/register", "/api"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Handle subdomain requests (public booking pages)
  if (isSubdomain) {
    // Extract subdomain (e.g., "myshop" from "myshop.barberbook.my.id")
    const subdomain = hostWithoutPort.replace(`.${baseDomainWithoutPort}`, "");

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
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: getSessionTokenCookieName(request),
    });
    if (!token) {
      const loginUrl = getSecureUrl(request, "/auth/login");
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = token.role as string;

    // CASHIER restricted routes
    const cashierRestrictedRoutes = [
      "/dashboard/analytics",
      "/dashboard/barbers",
      "/dashboard/users",
      "/dashboard/settings",
    ];
    if (role === "CASHIER") {
      const isRestricted = cashierRestrictedRoutes.some((route) =>
        pathname.startsWith(route)
      );
      if (isRestricted) {
        return NextResponse.redirect(getSecureUrl(request, "/dashboard"));
      }
    }

    // Role-based access: /dashboard/users requires ADMIN or OWNER
    if (pathname.startsWith("/dashboard/users")) {
      if (role !== "ADMIN" && role !== "OWNER") {
        return NextResponse.redirect(getSecureUrl(request, "/dashboard"));
      }
    }
  }

  // Redirect logged-in users away from auth pages
  if (isPublicPath && !pathname.startsWith("/api")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: getSessionTokenCookieName(request),
    });
    if (token) {
      return NextResponse.redirect(getSecureUrl(request, "/dashboard"));
    }
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
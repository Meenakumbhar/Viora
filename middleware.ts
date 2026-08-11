import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, computeAdminToken } from "@/utils/admin-auth";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"]);

function isProtectedApiRoute(pathname: string, method: string): boolean {
  if (pathname === "/api/upload") return true; // upload/delete to R2 — admin only
  if (pathname === "/api/portfolio" && method === "POST") return true;
  if (pathname.startsWith("/api/portfolio/") && (method === "PUT" || method === "DELETE")) return true;
  if (pathname === "/api/orders" || pathname.startsWith("/api/orders/")) return true; // customer PII — admin only, all methods
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.has(pathname);
  const isAdminApi = isProtectedApiRoute(pathname, request.method);

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const cookieToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const expectedToken = adminPassword ? await computeAdminToken(adminPassword) : null;
  const authorized = Boolean(expectedToken) && cookieToken === expectedToken;

  if (authorized) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

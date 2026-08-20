import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminToken } from "@/utils/admin-auth";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db";

// Better Auth's own docs say getSession() in middleware needs the Node.js
// runtime for full DB-backed session validation — Next.js confirms this
// file (proxy.ts, not middleware.ts) always runs on Node.js already, so no
// runtime export is needed (or allowed) here.

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"]);
const USER_PROTECTED_PREFIXES = ["/account"];
const STAFF_PROTECTED_PREFIXES = ["/staff"];
const STAFF_ROLES = new Set(["designer", "employee", "proofreader", "admin"]);

async function getSessionUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return null;
  return getUserById(session.user.id);
}

function isProtectedApiRoute(pathname: string, method: string): boolean {
  if (pathname === "/api/portfolio" && method === "POST") return true;
  if (pathname.startsWith("/api/portfolio/") && (method === "PUT" || method === "DELETE")) return true;
  if (pathname === "/api/products" && method === "POST") return true;
  if (pathname.startsWith("/api/products/") && (method === "PUT" || method === "DELETE")) return true;
  if (pathname === "/api/orders" || (pathname.startsWith("/api/orders/") && !pathname.endsWith("/payment"))) return true; // customer PII — admin only
  if (pathname.endsWith("/payment") && method === "PATCH") return true; // admin sets price
  if (pathname.startsWith("/api/admin/users")) return true; // role management — admin only
  if (pathname.startsWith("/api/admin/orders/")) return true; // design revisions — admin only
  if (pathname === "/api/admin/portfolio-item-pricing") return true; // per-portfolio-piece pricing — admin only
  if (pathname === "/api/admin/customer-item-pricing") return true; // per-customer, per-piece pricing — admin only
  // /api/upload — admin OR staff (checked separately below, both can upload design proofs)
  // /api/staff/* — staff-role only (checked separately below)
  // /api/payments/* — user-authenticated internally, not admin-gated here
  // /api/account/* — user-authenticated internally, not admin-gated here
  // /api/admin/login, /api/admin/logout — public entry points, not gated here
  return false;
}

async function isStaffAuthorized(request: NextRequest): Promise<boolean> {
  const user = await getSessionUser(request);
  return Boolean(user && STAFF_ROLES.has(user.role));
}

async function isAdminAuthorized(request: NextRequest): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const cookieToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminToken(cookieToken, adminPassword);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Customer account pages (separate from admin/staff auth) ────────────────
  if (USER_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session) {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Staff dashboard (designer / employee / admin-role accounts) ────────────
  if (STAFF_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const user = await getSessionUser(request);

    if (user && STAFF_ROLES.has(user.role)) {
      return NextResponse.next();
    }
    if (user) {
      // Logged in, just not staff — send them to their own area, not back to login.
      return NextResponse.redirect(new URL("/account", request.url));
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Staff-only API routes ───────────────────────────────────────────────────
  if (pathname.startsWith("/api/staff/")) {
    if (await isStaffAuthorized(request)) {
      return NextResponse.next();
    }
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  // ── Uploads ── /api/upload is deliberately NOT gated here: the customer
  // order form (public, no login — see app/order-form/[enquiryId]) uploads
  // attachments through it too. It enforces admin-or-staff auth itself,
  // scoped to every folder except the order-form-attachments one.

  // ── Admin dashboard + admin-only API routes ─────────────────────────────────
  const isAdminPage = pathname.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.has(pathname);
  const isAdminApi = isProtectedApiRoute(pathname, request.method);

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  if (await isAdminAuthorized(request)) {
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

import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

export default NextAuth(authConfig).auth((req) => {
  const reqUrl = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;
  const path = reqUrl.pathname;

  // If not logged in and trying to access anything other than /login
  if (!isLoggedIn && path !== "/login") {
    if (path.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    return Response.redirect(new URL("/login", reqUrl.origin));
  }

  // If logged in and trying to access /login, redirect to dashboard
  if (isLoggedIn && path === "/login") {
    return Response.redirect(new URL("/", reqUrl.origin));
  }

  // Role-based authorization
  if (isLoggedIn) {
    if (path.startsWith("/admin") && userRole !== "admin") {
      return Response.redirect(new URL("/", reqUrl.origin));
    }
    if (path.startsWith("/reports") && userRole !== "admin" && userRole !== "accountant") {
      return Response.redirect(new URL("/", reqUrl.origin));
    }
    if (path.startsWith("/pos") && userRole !== "admin" && userRole !== "frontdesk" && userRole !== "inventory") {
      return Response.redirect(new URL("/", reqUrl.origin));
    }
    if (path.startsWith("/housekeeping") && userRole !== "admin" && userRole !== "housekeeping") {
      return Response.redirect(new URL("/", reqUrl.origin));
    }
    if ((path.startsWith("/frontdesk") || path.startsWith("/reservation")) && userRole !== "admin" && userRole !== "frontdesk") {
      return Response.redirect(new URL("/", reqUrl.origin));
    }
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};

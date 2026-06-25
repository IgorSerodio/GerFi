import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { hasPermission } from "./features/auth/permissions";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const role = (token.role as string) || "";

    if (path.startsWith("/gerenciamento") && !hasPermission("ACCESS_MANAGEMENT", role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (path.startsWith("/atendimento") && !hasPermission("ACCESS_ATTENDANCE", role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (path.startsWith("/triagem") && !hasPermission("ACCESS_TRIAGE", role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/triagem", "/atendimento", "/gerenciamento"],
};

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const role = (token.role as string) || "";

    if (path.startsWith("/gerenciamento") && !["Admin", "Gerente"].includes(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (path.startsWith("/atendimento") && !["Admin", "Atendente", "Gerente"].includes(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    if (path.startsWith("/triagem") && !["Admin", "Triador", "Atendente", "Gerente"].includes(role)) {
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

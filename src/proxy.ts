import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { hasPermission, ActionName } from '@/features/auth/permissions';

const routePermissions: Record<string, ActionName | null> = {
  '/atendimento': 'ACCESS_ATTENDANCE',
  '/gerenciamento': 'ACCESS_MANAGEMENT',
  '/triagem': 'ACCESS_TRIAGE',
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicFile = pathname.includes('.') || pathname.startsWith('/_next');
  const isLoginPage = pathname === '/login';
  const isAuthApi = pathname.startsWith('/api/auth');

  if (isPublicFile || isAuthApi || isLoginPage) return NextResponse.next();

  const matchedPath = Object.keys(routePermissions).find(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!matchedPath) return NextResponse.next();

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('authError', 'unauthorized');
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiredAction = routePermissions[matchedPath];

  if (requiredAction) {
    const userRole = token.role as string;
    const hasPerm = hasPermission(requiredAction, userRole);

    if (!hasPerm) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('authError', 'forbidden');
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/|_next/static|_next/image|favicon.ico).*)'],
};

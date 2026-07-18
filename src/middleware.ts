import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Look for the exact session cookie name we set in auth-actions
  const token = request.cookies.get('auth_session');
  
  const isDashboardRoute = pathname.startsWith('/hq-portal');
  const isLoginRoute = pathname === '/hq-portal/login';

  // 2. Exception Guard: Allow access to the login page no matter what
  if (isLoginRoute) {
    // If they are already logged in, redirect them away from login straight to the workspace
    if (token) {
      return NextResponse.redirect(new URL('/hq-portal', request.url));
    }
    return NextResponse.next();
  }

  // 3. Protection Guard: If visiting any admin path without a cookie, redirect home
  if (isDashboardRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Config tells Next.js to intercept requests under the hq-portal route group
export const config = {
  matcher: ['/hq-portal/:path*'],
};

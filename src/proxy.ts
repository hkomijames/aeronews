import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Look for the exact session cookie name set in auth-actions
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

// ─── OPTIMIZED CONFIGURATION MATCHER TREE ───
export const config = {
  matcher: [
    '/hq-portal',          // ✨ Explicitly catches the base root administration URL
    '/hq-portal/:path*',   // Catches all internal deep-links inside the portal layout tree
  ],
};

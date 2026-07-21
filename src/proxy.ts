import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('auth_session');
  
  const isDashboardRoute = pathname.startsWith('/hq-portal');
  const isLoginRoute = pathname === '/hq-portal/login';

  // 1. Exception Guard: Allow access to the login page no matter what
  if (isLoginRoute) {
    if (token) {
      return NextResponse.redirect(new URL('/hq-portal', request.url));
    }
    
    // Add noindex header to the login page itself
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return response;
  }

  // 2. Protection Guard: If visiting any admin path without a cookie, serve a fake 404
  if (isDashboardRoute && !token) {
    // Internally masks the route with your custom 404 page. 
    // The user sees a 404 status but the URL doesn't change.
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  // 3. Authorized Traffic: Inject noindex headers just in case a bot somehow bypasses guards
  if (isDashboardRoute) {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    return response;
  }

  return NextResponse.next();
}

// ─── OPTIMIZED CONFIGURATION MATCHER TREE ───
export const config = {
  matcher: [
    '/hq-portal',          
    '/hq-portal/:path*',   
  ],
};

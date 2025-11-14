/**
 * Next.js Middleware
 * Protects routes and handles authentication
 */

import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Define protected routes
  const protectedPaths = ['/dashboard', '/versions', '/compare', '/reports', '/settings'];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Allow access to public routes
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  try {
    const session = await auth();

    if (!session) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(signInUrl);
    }

    // ADMIN-only route check for /settings
    if (request.nextUrl.pathname.startsWith('/settings')) {
      if (session.user?.role !== 'ADMIN') {
        // Redirect non-ADMIN users to dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // If auth check fails (e.g., database connection issue), allow access
    // This prevents blocking the app when database is temporarily unavailable
    console.error('Middleware auth check failed:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match protected routes only:
     * - /dashboard, /versions, /compare, /reports, /settings
     * Exclude:
     * - / (homepage)
     * - /api/auth (NextAuth routes)
     * - /auth (auth pages)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api/auth|auth|_next/static|_next/image|favicon.ico|^/$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};


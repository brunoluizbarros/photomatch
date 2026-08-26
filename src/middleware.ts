import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

// Checagem edge-safe (só lê o cookie, sem ir ao banco) — cobre tanto a página
// quanto o POST de Server Actions no mesmo path.
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/auth/sign-in?callbackUrl=${callbackUrl}`, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

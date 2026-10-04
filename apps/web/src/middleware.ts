import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/session';

export function middleware(request: NextRequest) {
  const hasToken = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);
  const isLoginPage = request.nextUrl.pathname === '/login';

  if (!hasToken && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (hasToken && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
};

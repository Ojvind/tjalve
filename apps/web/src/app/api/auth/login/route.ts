import { NextRequest, NextResponse } from 'next/server';
import { apiLogin, ApiError } from '@/lib/api';
import { TOKEN_COOKIE } from '@/lib/session';

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  try {
    const { token } = await apiLogin(email, password);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return response;
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json({ error: 'Fel e-post eller lösenord' }, { status });
  }
}

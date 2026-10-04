import { NextRequest, NextResponse } from 'next/server';
import { apiToggleProgress, ApiError } from '@/lib/api';
import { getToken } from '@/lib/session';

// Thin proxy: reads the session cookie, forwards as a Bearer token to the
// API. planId/sessionId come from the client, but the API itself derives
// the user from the token — this route can't be used to touch another
// user's progress no matter what planId a caller sends.
export async function POST(request: NextRequest) {
  const token = getToken();
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { planId, sessionId } = await request.json();
  if (!planId || !sessionId) return NextResponse.json({ error: 'planId and sessionId are required' }, { status: 400 });

  try {
    const result = await apiToggleProgress(token, planId, sessionId);
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 500;
    return NextResponse.json({ error: 'Kunde inte spara' }, { status });
  }
}

import { cookies } from 'next/headers';

export const TOKEN_COOKIE = 'tjalve_token';

export function getToken(): string | undefined {
  return cookies().get(TOKEN_COOKIE)?.value;
}

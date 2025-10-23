import { cookies } from 'next/headers';

export const cookieOptions = {
  name: 'sb-auth-token',
  lifetime: 60 * 60 * 24 * 7, // 1 semana
  domain: '',
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
};

export function getCookie(name: string) {
  return cookies().get(name)?.value;
}

export function setCookie(name: string, value: string, options: any = {}) {
  cookies().set({
    name,
    value,
    ...cookieOptions,
    ...options,
  });
}

export function removeCookie(name: string, options: any = {}) {
  cookies().set({
    name,
    value: '',
    ...cookieOptions,
    ...options,
    maxAge: 0,
  });
}

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rotas públicas que não requerem autenticação
const publicRoutes = [
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
  '/api/auth/callback',
];

export async function middleware(request: NextRequest) {
  // Criar uma resposta que pode ser modificada
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Configurar o cliente Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Obter a sessão do usuário
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // Se o usuário não estiver autenticado e tentar acessar uma rota protegida
  if (!session && !publicRoutes.some(route => pathname.startsWith(route))) {
    // Redirecionar para a página de login
    const redirectUrl = new URL('/auth/sign-in', request.url);
    // Adicionar a URL atual como parâmetro para redirecionar após o login
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Se o usuário estiver autenticado e tentar acessar a página de login, redirecionar para a página inicial
  if (session && (pathname === '/auth/sign-in' || pathname === '/auth/sign-up')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth/|auth/forgot-password|auth/reset-password).*)',
  ],
};

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // IGNORAR COMPLETAMENTE a API problemática e outras APIs
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // IGNORAR arquivos estáticos e rotas públicas
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Criar uma resposta para podermos modificar os cookies
  const response = NextResponse.next();
  
  // Inicializar o cliente Supabase
  const supabase = createClient();
  
  // Obter a sessão
  const { data: { session } } = await supabase.auth.getSession();
  
  // Rotas de autenticação
  const authRoutes = ['/auth/login', '/auth/sign-up'];
  const isAuthRoute = authRoutes.includes(pathname);
  
  // Se o usuário não está autenticado e tenta acessar uma rota protegida
  if (!session && !isAuthRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se o usuário está autenticado e tenta acessar uma rota de autenticação
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
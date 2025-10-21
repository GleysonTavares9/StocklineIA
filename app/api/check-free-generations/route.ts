import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Função para decodificar JWT manualmente (apenas para pegar o user_id)
function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar JWT:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    // Obter token do header Authorization ou dos cookies
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Tentar obter do cookie diretamente
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        // Procurar por diferentes formatos de cookie do Supabase
        const tokenMatches = [
          ...cookieHeader.matchAll(/(sb-[^-]+-auth-token)=([^;]+)/g),
          ...cookieHeader.matchAll(/(sb-access-token)=([^;]+)/g)
        ];
        
        if (tokenMatches.length > 0) {
          // Pegar o último token encontrado (mais recente)
          token = tokenMatches[tokenMatches.length - 1][2];
        }
      }
    }

    if (!token) {
      console.log('Nenhum token encontrado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    console.log('Token encontrado, comprimento:', token.length);

    let userId: string | null = null;

    // Tentativa 1: Decodificar JWT manualmente para obter user_id
    try {
      const decoded = decodeJWT(token);
      if (decoded && decoded.sub) {
        userId = decoded.sub;
        console.log('User ID obtido via JWT decode:', userId);
      }
    } catch (decodeError) {
      console.log('Falha ao decodificar JWT manualmente:', decodeError);
    }

    // Tentativa 2: Usar Supabase para validar o token
    if (!userId) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (userError) {
          console.error('Erro Supabase getUser:', userError);
          // Continuar mesmo com erro, tentaremos usar apenas o user_id se disponível
        } else if (user) {
          userId = user.id;
          console.log('User ID obtido via Supabase:', userId);
        }
      } catch (supabaseError) {
        console.error('Erro na chamada Supabase:', supabaseError);
      }
    }

    // Se não conseguimos obter o user_id, retornar erro
    if (!userId) {
      console.log('Não foi possível obter user_id do token');
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // AGORA usar o user_id para consultar o banco diretamente
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subscription) {
      return NextResponse.json({ used: 0 });
    }

    const { count } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return NextResponse.json({ used: count || 0 });

  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json({ used: 0 });
  }
}
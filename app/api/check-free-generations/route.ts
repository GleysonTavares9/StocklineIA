import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Verificar se o perfil do usuário existe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error("Erro ao carregar perfil:", profileError);
      // Retornar 0 gerações usadas em caso de erro, permitindo que o usuário continue
      return NextResponse.json({ used: 0 });
    }
    
    // Verificar se o usuário tem uma assinatura
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    // Se houver erro na consulta de assinatura, não bloquear o usuário
    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error("Erro ao verificar assinatura:", subscriptionError);
      return NextResponse.json({ used: 0 });
    }
    
    // Se o usuário tem uma assinatura, não precisa contar gerações gratuitas
    if (subscription) {
      return NextResponse.json({ used: 0 });
    }
    
    // Contar quantas gerações gratuitas o usuário já usou
    const { count, error: countError } = await supabase
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (countError) {
      console.error("Erro ao contar gerações:", countError);
      return NextResponse.json({ used: 0 });
    }
    
    return NextResponse.json({ used: count || 0 });
  } catch (error) {
    console.error("Erro inesperado:", error);
    // Em caso de erro, permitir que o usuário continue
    return NextResponse.json({ used: 0 });
  }
}
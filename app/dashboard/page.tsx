import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, CreditCard, Bell, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic' // Impede a renderização estática
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Buscar dados em paralelo para melhor desempenho
  const [
    { data: profile },
    { data: subscription },
    { count: musicCount },
    { data: recentSongs },
    { data: notifications }
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_subscriptions').select('*, plans(*)').eq('user_id', user.id).single(),
    supabase.from('songs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('songs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  // Calcular créditos restantes
  const creditsRemaining = profile?.credits_balance || 0;
  const subscriptionName = subscription?.plans?.name || 'Básico';

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex space-x-4">
          <Button asChild>
            <Link href="/">Nova Música</Link>
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Restantes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditsRemaining}</div>
            <p className="text-xs text-muted-foreground">
              {subscription?.status === 'active' ? `Plano: ${subscriptionName}` : 'Sem assinatura ativa'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Músicas Criadas</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{musicCount || 0}</div>
            <p className="text-xs text-muted-foreground">Total de músicas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications?.filter(n => !n.read).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Não lidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <FileAudio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentSongs?.filter(s => s.status === 'completed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Músicas prontas</p>
          </CardContent>
        </Card>
      </div>

      {/* Últimas Músicas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimas Músicas</CardTitle>
          </CardHeader>
          <CardContent>
            {recentSongs && recentSongs.length > 0 ? (
              <div className="space-y-4">
                {recentSongs.map((song) => (
                  <div key={song.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                    <div>
                      <h3 className="font-medium">{song.title || 'Sem título'}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(song.created_at).toLocaleDateString('pt-BR')} • {song.status}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/biblioteca/${song.id}`}>Ver</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma música encontrada.</p>
            )}
            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/biblioteca">Ver todas as músicas</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notificações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications && notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 rounded-md ${!notification.read ? 'bg-muted/50' : ''}`}
                  >
                    <h3 className="font-medium">{notification.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma notificação recente.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

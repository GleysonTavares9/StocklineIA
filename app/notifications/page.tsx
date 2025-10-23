import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { markAllNotificationsAsReadAction } from '@/app/actions/notifications';
import NotificationsList from './NotificationsList';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const supabase = await createClient();

  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Buscar notificações
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500">Erro ao carregar notificações. Por favor, tente novamente.</p>
      </div>
    );
  }

  // Marcar todas como lidas ao abrir a página
  if (notifications && notifications.some(n => !n.read)) {
    await markAllNotificationsAsReadAction(new FormData());
  }

  return <NotificationsList notifications={notifications || []} />;
}

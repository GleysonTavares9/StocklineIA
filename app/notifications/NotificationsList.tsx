'use client';

import { markAllNotificationsAsReadAction } from '@/app/actions/notifications';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function NotificationsList({ notifications }: { notifications: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleMarkAllAsRead = async () => {
    startTransition(async () => {
      try {
        await markAllNotificationsAsReadAction(new FormData());
        // Refresh the page to show updated notifications
        router.refresh();
      } catch (error) {
        console.error('Failed to mark all as read:', error);
      }
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notificações</h1>
        {notifications && notifications.length > 0 && (
          <Button 
            onClick={handleMarkAllAsRead}
            variant="ghost" 
            className="text-sm"
            disabled={isPending}
          >
            {isPending ? 'Processando...' : 'Marcar todas como lidas'}
          </Button>
        )}
      </div>

      {notifications && notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`p-4 rounded-lg border ${!notification.read ? 'bg-muted/50 border-primary/20' : 'bg-card'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(notification.created_at), "PPp", { locale: ptBR })}
                </span>
              </div>
              {!notification.read && (
                <div className="mt-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                  <span className="ml-2 text-xs text-muted-foreground">Não lida</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-muted-foreground"
            >
              <path d="M19.3 14.8 20 15.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3.5l.7-.7"></path>
              <path d="M12 2a6 6 0 0 0-6 6v4l-2 2.5V16h16v-1.5L18 12v-4a6 6 0 0 0-6-6z"></path>
              <path d="M12 22a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-1">Nenhuma notificação</h3>
          <p className="text-muted-foreground text-sm">
            Quando você tiver notificações, elas aparecerão aqui.
          </p>
        </div>
      )}
    </div>
  );
}

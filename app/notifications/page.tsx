import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"
import NotificationItem from "@/components/notification-item"
import { markAllNotificationsAsReadAction } from "@/app/actions/notifications"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const unreadCount = notifications?.filter(n => !n.read).length || 0

  const markAllAsRead = async () => {
    'use server'
    try {
      const { success, count } = await markAllNotificationsAsReadAction()
      if (success) {
        console.log(`Marcadas ${count} notificações como lidas`)
      }
    } catch (error) {
      console.error('Erro ao marcar notificações como lidas:', error)
    } finally {
      redirect('/notifications')
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    'use server'
    const supabase = createClient()
    
    await supabase
      .from('notifications')
      .update({ 
        read: true
      })
      .eq('id', notificationId)
      .eq('user_id', user.id)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900">Notificações</CardTitle>
            {unreadCount > 0 && (
              <form action={markAllAsRead}>
                <button 
                  type="submit"
                  className="text-sm text-[#338d97] hover:underline"
                >
                  Marcar todas como lidas
                </button>
              </form>
            )}
          </CardHeader>
          <CardContent>
            {notifications && notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Nenhuma notificação</p>
                <p className="text-sm text-gray-500 mt-1">Você será notificado quando houver novidades</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

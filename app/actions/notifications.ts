'use server'

import { createClient } from '@/lib/supabase/server'

export async function markNotificationAsReadAction(notificationId: string) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuário não autenticado')
  }

  const { error } = await supabase
    .from('notifications')
    .update({ 
      read: true
    })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error marking notification as read:', error)
    throw new Error('Falha ao marcar notificação como lida')
  }

  return { success: true }
}

export async function markAllNotificationsAsReadAction() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Usuário não autenticado')
  }

  // Primeiro, obter os IDs das notificações não lidas
  const { data: unreadNotifications, error: fetchError } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', user.id)
    .eq('read', false)

  if (fetchError) {
    console.error('Erro ao buscar notificações não lidas:', fetchError)
    throw new Error('Falha ao buscar notificações')
  }

  // Se não houver notificações não lidas, retornar sucesso
  if (!unreadNotifications || unreadNotifications.length === 0) {
    return { success: true, count: 0 }
  }

  const notificationIds = unreadNotifications.map(n => n.id)

  // Atualizar cada notificação individualmente
  const { error: updateError } = await supabase
    .from('notifications')
    .update({ 
      read: true
    })
    .in('id', notificationIds)

  if (updateError) {
    console.error('Erro ao atualizar notificações:', updateError)
    throw new Error('Falha ao atualizar notificações')
  }

  return { 
    success: true, 
    count: notificationIds.length 
  }
}

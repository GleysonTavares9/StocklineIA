"use client"

import { useState } from "react"
import { CheckCircle2, Info, AlertCircle, XCircle } from "lucide-react"
import { markNotificationAsReadAction } from "@/app/actions/notifications"

export default function NotificationItem({ notification, onMarkAsRead }: { 
  notification: any,
  onMarkAsRead: (id: string) => void 
}) {
  const [isRead, setIsRead] = useState(notification.read)
  const [isHovered, setIsHovered] = useState(false)

  const handleMarkAsRead = async () => {
    if (isRead) return
    
    try {
      await markNotificationAsReadAction(notification.id)
      setIsRead(true)
      onMarkAsRead(notification.id)
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-[#338d97] flex-shrink-0" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
      default:
        return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
    }
  }

  return (
    <div 
      className={`p-4 rounded-lg border ${
        isRead 
          ? "bg-white border-gray-200" 
          : "bg-blue-50 border-[#338d97] cursor-pointer"
      } shadow-sm hover:shadow-md transition-all`}
      onClick={handleMarkAsRead}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleMarkAsRead()
        }
      }}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-900 break-words">{notification.title}</h3>
            {!isRead && isHovered && (
              <button 
                onClick={handleMarkAsRead}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Marcar como lida"
                title="Marcar como lida"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 break-words">{notification.message}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(notification.created_at).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  )
}

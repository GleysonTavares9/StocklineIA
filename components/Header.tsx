'use client'

import { Bell, ChevronDown, CreditCard, LogOut, Settings, User, Music } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ptBR } from "@/lib/translations"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { logout } from "@/app/auth/logout/actions"
import { useEffect, useState } from "react"

interface HeaderProps {
  user: SupabaseUser
  profile: {
    id: string
    email: string
    display_name: string | null
    credits: number
    avatar_url?: string | null
    username?: string
    full_name?: string | null
    website?: string | null
    plan_id?: string | null
    stripe_customer_id?: string | null
    created_at?: string
    updated_at?: string | null
  } | null
  unreadNotifications: number
}

export default function Header({ user, profile, unreadNotifications }: HeaderProps) {
  const router = useRouter()

  const displayName = profile?.display_name || user.email?.split("@")[0] || "Usuário"
  const avatarInitial = displayName?.[0]?.toUpperCase() || "U"
  const t = ptBR.header

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#338d97] rounded-lg flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{t.appName}</h1>
      </div>
      <div className="flex items-center gap-4">
        {profile && (
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
            <CreditCard className="w-4 h-4 text-[#338d97]" />
            <span className="text-sm font-medium text-gray-700">{profile.credits || 0} créditos</span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="text-gray-700 hover:bg-gray-100 relative"
          onClick={() => router.push("/notifications")}
        >
          <Bell className="w-5 h-5 text-gray-700" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadNotifications}
            </span>
          )}
        </Button>

        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="flex items-center gap-2 focus:outline-none"
                aria-label={t.userMenu.userMenu}
              >
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm hover:ring-2 hover:ring-[#338d97] transition-all">
                  <AvatarFallback className="bg-[#338d97] text-white font-medium">
                    {avatarInitial}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center gap-3 p-3 border-b">
                <Avatar className="h-10 w-10">
                  {profile?.avatar_url ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={profile.avatar_url} 
                        alt={displayName}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          // Se houver erro ao carregar a imagem, mostra o fallback
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <AvatarFallback className="bg-[#338d97] text-white font-medium">
                      {avatarInitial}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push('/perfil')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>{t.userMenu.profile}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/billing')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>{t.userMenu.billing}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t.userMenu.settings}</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t.userMenu.signOut}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  )
}

'use client'

import { Bell, Music, LayoutDashboard, LogOut, CreditCard } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { logout } from "@/app/auth/logout/actions"

interface HeaderProps {
  user: User
  profile: {
    id: string
    email: string
    display_name: string | null
    credits: number
  } | null
  unreadNotifications: number
}

export default function Header({ user, profile, unreadNotifications }: HeaderProps) {
  const router = useRouter()

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User"
  const avatarInitial = displayName[0]?.toUpperCase() || "U"

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#338d97] rounded-lg flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">StocklineIA</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
          <CreditCard className="w-4 h-4 text-[#338d97]" />
          <span className="text-sm font-medium text-gray-700">{profile?.credits || 0}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-zinc-800 relative"
          onClick={() => router.push("/notifications")}
        >
          <Bell className="w-5 h-5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadNotifications}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
             <Avatar className="w-10 h-10 bg-zinc-700 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <AvatarFallback className="bg-primary text-black font-bold">{avatarInitial}</AvatarFallback>
              </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/billing')}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  )
}

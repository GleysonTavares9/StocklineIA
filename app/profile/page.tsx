import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export const dynamic = 'force-dynamic' // Impede a renderização estática
import { LogOut } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"
import { ProfileTabs } from "./components/ProfileTabs"

export default async function ProfilePage() {
  const supabase = createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: songs } = await supabase
    .from("songs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Profile Header */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 bg-gray-100">
                <AvatarFallback className="bg-[#338d97] text-white text-3xl font-bold">
                  {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {profile?.display_name || user.email?.split('@')[0]}
                </h1>
                <p className="text-gray-600">{user.email}</p>
                
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="bg-gray-50 px-4 py-2 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Créditos</p>
                    <p className="text-xl font-bold text-[#338d97]">{profile?.credits || 0}</p>
                  </div>
                  <div className="bg-gray-50 px-4 py-2 rounded-lg text-center">
                    <p className="text-sm text-gray-500">Músicas</p>
                    <p className="text-xl font-bold text-gray-900">{songs?.length || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <ProfileTabs user={user} profile={profile} songs={songs} />

        {/* Logout Button */}
        <div className="flex justify-end">
          <form action="/auth/logout" method="post">
            <Button 
              type="submit" 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

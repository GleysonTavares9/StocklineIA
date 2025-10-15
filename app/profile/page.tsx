import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Music2, LogOut } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"

export default async function ProfilePage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Card */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Profile</CardTitle>
            <CardDescription className="text-gray-400">Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 bg-[#2a2a2a]">
                <AvatarFallback className="bg-[#00ff00] text-black text-2xl font-bold">
                  {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-white">{profile?.display_name || "User"}</h2>
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Credits</p>
                <p className="text-2xl font-bold text-[#00ff00]">{profile?.credits || 0}</p>
              </div>
              <div className="bg-[#2a2a2a] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Songs Created</p>
                <p className="text-2xl font-bold text-white">{songs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Songs History */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Your Songs</CardTitle>
            <CardDescription className="text-gray-400">Recently created music</CardDescription>
          </CardHeader>
          <CardContent>
            {songs && songs.length > 0 ? (
              <div className="space-y-3">
                {songs.map((song) => (
                  <div key={song.id} className="bg-[#2a2a2a] p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{song.title || "Untitled"}</h3>
                        <p className="text-sm text-gray-400">{song.style}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          song.status === "completed"
                            ? "bg-green-500/20 text-green-500"
                            : song.status === "failed"
                              ? "bg-red-500/20 text-red-500"
                              : "bg-yellow-500/20 text-yellow-500"
                        }`}
                      >
                        {song.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No songs created yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

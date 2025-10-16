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
  const supabase = await createClient(cookieStore)

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
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Profile Card */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Profile</CardTitle>
            <CardDescription className="text-gray-600">Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 bg-gray-100">
                <AvatarFallback className="bg-[#338d97] text-white text-2xl font-bold">
                  {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{profile?.display_name || "User"}</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Credits</p>
                <p className="text-2xl font-bold text-[#338d97]">{profile?.credits || 0}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Songs Created</p>
                <p className="text-2xl font-bold text-gray-900">{songs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Songs History */}
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900">Your Songs</CardTitle>
            <CardDescription className="text-gray-600">Recently created music</CardDescription>
          </CardHeader>
          <CardContent>
            {songs && songs.length > 0 ? (
              <div className="space-y-3">
                {songs.map((song) => (
                  <div key={song.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{song.title || "Untitled"}</h3>
                        <p className="text-sm text-gray-600">{song.style}</p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          song.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : song.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {song.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <Music2 className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">No songs created yet</p>
                <Button asChild variant="outline" className="mt-4 bg-white">
                  <Link href="/">Create your first song</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <form action="/auth/logout" method="post">
            <Button 
              type="submit" 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

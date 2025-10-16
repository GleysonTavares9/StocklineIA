import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import Header from "@/components/Header"
import BottomNav from "@/components/BottomNav"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    profile = data
  }

  let unreadNotifications = 0
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)
    unreadNotifications = count || 0
  }

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="bg-white text-gray-900 min-h-screen flex flex-col">
        {user && profile && <Header user={user} profile={profile} unreadNotifications={unreadNotifications} />}
        <main className="flex-1 container mx-auto px-4 py-6">
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </main>
        {user && <BottomNav />}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

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
  let user = null;
  let profile = null;
  let unreadNotifications = 0;

  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    
    if (authData?.user) {
      user = authData.user;
      
      // Fetch profile in parallel with notifications
      const [profileData, { count }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false)
      ]);
      
      profile = profileData.data;
      unreadNotifications = count || 0;
    }
  } catch (error) {
    console.error('Error in layout:', error);
  }

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="bg-white text-gray-900 min-h-screen flex flex-col">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
          {user && profile && <Header user={user} profile={profile} unreadNotifications={unreadNotifications} />}
        </div>
        
        <div className="flex-1 pt-20 pb-24 overflow-y-auto">
          <main className="container mx-auto px-4 h-full">
            <Suspense fallback={<div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#338d97]"></div>
            </div>}>
              <div className="max-w-3xl mx-auto">
                {children}
              </div>
            </Suspense>
          </main>
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100">
          {user && <BottomNav />}
        </div>
        
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

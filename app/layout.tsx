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
import { StripeProvider } from "@/components/stripe/stripe-provider"

export const dynamic = 'force-dynamic' // Impede a renderização estática

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
      
      // Log para depuração
      console.log('User data from auth:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });
      
      try {
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
        
        // Log para depuração
        console.log('User profile data from database:', profile);
        
        // Se não houver perfil, tenta criar um
        if (!profile || profile.error) {
          console.log('No profile found, creating one...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              username: `user_${user.id.substring(0, 8)}`,
              credits: 3,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error creating profile:', createError);
          } else {
            console.log('New profile created:', newProfile);
            profile = newProfile;
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }
  } catch (error) {
    console.error('Error in layout:', error);
  }

  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body className="bg-white text-gray-900 min-h-screen flex flex-col">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm supports-[backdrop-filter]:bg-white/60 shadow-sm">
          {user && (
            <Header 
              user={user} 
              profile={profile} 
              unreadNotifications={unreadNotifications} 
            />
          )}
        </div>
        
        <div className="flex-1 pt-16 pb-20 sm:pt-20 sm:pb-24 overflow-y-auto">
          <main className="w-full h-full">
            <StripeProvider>
              <div className="flex flex-col min-h-screen">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full min-h-[60vh]">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#338d97] border-t-transparent"></div>
                  </div>
                }>
                  <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6">
                    <div className="w-full">
                      {children}
                    </div>
                  </div>
                </Suspense>
                {user && <BottomNav />}
                <Toaster />
                <Analytics />
              </div>
            </StripeProvider>
          </main>
        </div>
      </body>
    </html>
  )
}

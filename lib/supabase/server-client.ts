import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
      cookies: {
        get: (name: string) => {
          return cookieStore.get(name)?.value || null
        },
        set: (name: string, value: string) => {
          // Cookies são definidos apenas em Server Actions ou Route Handlers
          return Promise.resolve()
        },
        remove: (name: string) => {
          // Cookies são removidos apenas em Server Actions ou Route Handlers
          return Promise.resolve()
        },
      },
      cookieOptions: {
        name: 'sb-auth-token',
        lifetime: 60 * 60 * 24 * 7, // 1 week
        domain: '',
        path: '/',
        sameSite: 'lax'
      }
    } as any // Forçando o tipo para evitar erros de tipagem
  )
}

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  
  // Criando um objeto que implementa a interface esperada
  const cookieMethods = {
    getItem: (key: string) => {
      return cookieStore.get(key)?.value || null
    },
    setItem: (key: string, value: string) => {
      try {
        cookieStore.set({
          name: key,
          value,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        })
      } catch (error) {
        console.error('Error setting cookie:', error)
      }
    },
    removeItem: (key: string) => {
      try {
        cookieStore.set({
          name: key,
          value: '',
          maxAge: 0,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        })
      } catch (error) {
        console.error('Error removing cookie:', error)
      }
    },
    getAll: () => {
      return cookieStore.getAll().map(cookie => ({
        name: cookie.name,
        value: cookie.value
      }))
    }
  }
  
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
        get: cookieMethods.getItem,
        set: (name: string, value: string, options: any) => {
          cookieMethods.setItem(name, value)
          return Promise.resolve()
        },
        remove: (name: string, options: any) => {
          cookieMethods.removeItem(name)
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

declare global {
  interface Window {
    ENV: {
      NEXT_PUBLIC_SUPABASE_URL: string
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    }
  }
}
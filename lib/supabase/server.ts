import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  
  // For server components and route handlers
  if (typeof window === 'undefined') {
    return createSupabaseServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              // Only set cookies in server actions or route handlers
              if (typeof document === 'undefined') {
                cookieStore.set({
                  name,
                  value,
                  ...options,
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  path: '/',
                })
              }
            } catch (error) {
              // Silently handle cookie setting errors
              if (process.env.NODE_ENV === 'development') {
                console.log('Cookie setting skipped in middleware')
              }
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({
                name,
                value: '',
                ...options,
                maxAge: 0,
                path: '/',
              })
            } catch (error) {
              console.error('Error removing cookie in middleware:', error)
            }
          },
        },
      }
    )
  }
  
  // For client components
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return null
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
          return cookie ? decodeURIComponent(cookie) : null
        },
        set(name: string, value: string, options: any) {
          try {
            document.cookie = `${name}=${encodeURIComponent(value)}; ${Object.entries(options)
              .map(([key, val]) => `${key}=${val}`)
              .join('; ')}`
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: any) {
          try {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${options?.path || '/'};`
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
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
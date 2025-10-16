'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string || '/'
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return redirect(`/auth/login?message=${encodeURIComponent(error.message)}`)
    }

    // Forçar atualização dos cookies
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return redirect('/auth/login?message=Failed to create session')
    }

    // Redirecionar para a página inicial ou para a URL de redirecionamento
    return redirect(redirectTo)
  } catch (error) {
    console.error('Login error:', error)
    return redirect('/auth/login?message=An unexpected error occurred')
  }
}

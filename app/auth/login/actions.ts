'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectTo = formData.get('redirectTo') as string || '/'
  
  // Validar entrada
  if (!email || !password) {
    return redirect('/auth/login?message=Email e senha são obrigatórios')
  }

  const supabase = createClient()

  try {
    // Tentar fazer login
    const { error, data } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    if (error) {
      console.error('Erro de autenticação:', error.message)
      return redirect(`/auth/login?message=${encodeURIComponent('Email ou senha inválidos')}`)
    }

    if (!data.session) {
      console.error('Sessão não criada após login')
      return redirect('/auth/login?message=Não foi possível criar uma sessão. Tente novamente.')
    }

    console.log('Login bem-sucedido para:', email)
    
    // Redirecionar para a página inicial ou para a URL de redirecionamento
    // Usando replace: true para evitar problemas de histórico de navegação
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectUrl = new URL(redirectTo, baseUrl).toString()
    
    console.log('Redirecionando para:', redirectUrl)
    return redirect(redirectUrl)
    
  } catch (error) {
    console.error('Erro inesperado durante o login:', error)
    return redirect('/auth/login?message=Ocorreu um erro inesperado. Tente novamente.')
  }
}
